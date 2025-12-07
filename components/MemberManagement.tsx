
import React, { useState, useEffect } from 'react';
import { getUsers, toggleUserStatus, deleteUser, getTransactions, grantManualAccess, deleteUserAccess, updateUserAccess, toggleKakaAccess, updateUserProfile, performMockOCR, getHumanDesignByUserId, saveHumanDesignProfiles, getHumanDesignProfiles } from '../services/mockDatabase';
import { User, Product, HumanDesignProfile, HDPlanetaryData, HDCenters } from '../types';
import { Icons, TRANSLATIONS } from '../constants';
import CityAutocomplete from './CityAutocomplete';

interface Props {
  currentLang?: string;
}

const MemberManagement: React.FC<Props> = ({ currentLang = 'EN' }) => {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [limit, setLimit] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['EN'];
  
  // Editing User State
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState<any>({});

  // PDF Modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  
  // Grant Access State
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // OCR Modal State
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrUser, setOcrUser] = useState<User | null>(null);
  const [ocrStep, setOcrStep] = useState<'UPLOAD' | 'READY' | 'SCANNING' | 'RESULT'>('UPLOAD');
  const [ocrFileUrl, setOcrFileUrl] = useState('');
  const [ocrFileName, setOcrFileName] = useState('');
  const [scannedProfile, setScannedProfile] = useState<Partial<HumanDesignProfile>>({});

  // View Human Design State (in User Details)
  const [showHumanDesignTable, setShowHumanDesignTable] = useState(false);
  const [currentUserHumanDesign, setCurrentUserHumanDesign] = useState<HumanDesignProfile | null>(null);
  const [isEditingHD, setIsEditingHD] = useState(false);
  const [editHDData, setEditHDData] = useState<Partial<HumanDesignProfile>>({});

  // Filter Users
  const filteredUsers = users.filter(u => u.role !== 'ADMIN' && (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const memberList = filteredUsers.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  const getSponsorName = (id: string | null) => users.find(u => u.id === id)?.name || 'System';

  const handleToggleStatus = (id: string) => { toggleUserStatus(id); setUsers(getUsers()); };
  const handleDelete = (id: string) => { if (confirm('Delete this user?')) { deleteUser(id); setUsers(getUsers()); } };

  // New handler for KAKA toggle
  const handleToggleKaka = (id: string) => { toggleKakaAccess(id); setUsers(getUsers()); };

  const handleShowPdf = (user: User) => {
      const tx = getTransactions().filter(t => t.userId === user.id);
      const prods = tx.flatMap(t => t.items.map(i => i.product)).filter((v,i,a) => a.findIndex(x => x.id === v.id) === i);
      setUserProducts(prods);
      setModalUser(user);
      setShowPdfModal(true);
      setNewFileName('');
      setNewFileUrl('');
      setEditingProductId(null);
  };

  const handleViewUser = (user: User) => {
      setSelectedUser(user);
      setIsEditingUser(false);
      setIsEditingHD(false);
      setEditUserData({
          name: user.name,
          email: user.email,
          phone: user.kyc.phone,
          bankName: user.kyc.bankName,
          accountNumber: user.kyc.accountNumber,
          accountHolder: user.kyc.accountHolder,
          gender: user.kyc.gender,
          birthDate: user.kyc.birthDate,
          birthCity: user.kyc.birthCity,
          birthTime: user.kyc.birthTime,
          address: user.kyc.address
      });
      // Check for Human Design
      const hd = getHumanDesignByUserId(user.id);
      setCurrentUserHumanDesign(hd || null);
      setEditHDData(hd || {});
      setShowHumanDesignTable(false);
  };

  const handleSaveUser = () => {
      if (!selectedUser) return;
      updateUserProfile(selectedUser.id, {
          name: editUserData.name,
          email: editUserData.email,
          kyc: {
              ...selectedUser.kyc,
              phone: editUserData.phone,
              bankName: editUserData.bankName,
              accountNumber: editUserData.accountNumber,
              accountHolder: editUserData.accountHolder,
              gender: editUserData.gender,
              birthDate: editUserData.birthDate,
              birthCity: editUserData.birthCity,
              birthTime: editUserData.birthTime,
              address: editUserData.address
          }
      });
      // Refresh list
      setUsers(getUsers());
      // Update modal selection
      const updatedUser = getUsers().find(u => u.id === selectedUser.id) || null;
      setSelectedUser(updatedUser);
      setIsEditingUser(false);
      alert('User data updated successfully.');
  };

  const handleSaveHD = () => {
      if (!selectedUser || !editHDData) return;
      const allProfiles = getHumanDesignProfiles();
      const existingIdx = allProfiles.findIndex(p => p.userId === selectedUser.id);
      
      const newProfile: HumanDesignProfile = {
          ...editHDData,
          id: existingIdx !== -1 ? allProfiles[existingIdx].id : 'hd_' + Date.now(),
          userId: selectedUser.id,
          updatedAt: new Date().toISOString()
      } as HumanDesignProfile;

      if (existingIdx !== -1) {
          allProfiles[existingIdx] = newProfile;
      } else {
          allProfiles.push(newProfile);
      }
      
      saveHumanDesignProfiles(allProfiles);
      setCurrentUserHumanDesign(newProfile);
      setIsEditingHD(false);
      alert('Human Design Profile Updated!');
  };

  const handleHDImageUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setEditHDData({ ...editHDData, chartImage: ev.target.result as string });
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  // OCR HANDLERS
  const handleOpenOCR = (user: User) => {
      setOcrUser(user);
      setOcrStep('UPLOAD');
      setOcrFileUrl('');
      setOcrFileName('');
      setScannedProfile({});
      setShowOCRModal(true);
  };

  const handleOCRFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setOcrFileName(file.name);
          setOcrStep('SCANNING'); 
          const reader = new FileReader();
          reader.onload = (ev) => {
              setTimeout(() => {
                  if (ev.target?.result) setOcrFileUrl(ev.target.result as string);
                  setOcrStep('READY'); 
              }, 1000);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleScan = async () => {
      setOcrStep('SCANNING');
      try {
          const result = await performMockOCR(ocrFileUrl);
          setScannedProfile(result);
          setOcrStep('RESULT');
      } catch (e) {
          alert('Scan failed');
          setOcrStep('READY');
      }
  };

  const handleSaveOCR = () => {
      if (!ocrUser) return;
      const allProfiles = getHumanDesignProfiles();
      const existingIdx = allProfiles.findIndex(p => p.userId === ocrUser.id);
      
      const newProfile: HumanDesignProfile = {
          ...scannedProfile,
          id: existingIdx !== -1 ? allProfiles[existingIdx].id : 'hd_' + Date.now(),
          userId: ocrUser.id,
          chartImage: ocrFileUrl,
          updatedAt: new Date().toISOString()
      } as HumanDesignProfile;

      if (existingIdx !== -1) {
          allProfiles[existingIdx] = newProfile;
      } else {
          allProfiles.push(newProfile);
      }
      
      saveHumanDesignProfiles(allProfiles);
      alert('Human Design Profile Saved!');
      setShowOCRModal(false);
  };

  // ... (Existing Upload handlers)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsLoading(true);
          const file = e.target.files[0];
          setNewFileName(file.name);
          const reader = new FileReader();
          reader.onload = (ev) => {
              setTimeout(() => { 
                  if (ev.target?.result) setNewFileUrl(ev.target.result as string);
                  setIsLoading(false);
              }, 1500);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGrantAccess = (e: React.FormEvent) => {
      e.preventDefault();
      if (!modalUser || !newFileName || !newFileUrl) return;
      
      if (editingProductId) {
          updateUserAccess(modalUser.id, editingProductId, newFileUrl, newFileName);
          alert('File updated successfully.');
      } else {
          grantManualAccess(modalUser.id, newFileName, newFileUrl);
          alert('Access Granted Successfully.');
      }
      
      handleShowPdf(modalUser);
      setNewFileName('');
      setNewFileUrl('');
      setEditingProductId(null);
  };

  const handleDeleteAccess = (productId: string) => {
      if (!modalUser || !confirm('Revoke access to this file/product?')) return;
      deleteUserAccess(modalUser.id, productId);
      handleShowPdf(modalUser);
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>, p: Product) => {
     if (e.target.files && e.target.files[0] && modalUser) {
         const file = e.target.files[0];
         setIsLoading(true); 
         const reader = new FileReader();
         reader.onload = (ev) => {
             setTimeout(() => {
                if (ev.target?.result) {
                    updateUserAccess(modalUser.id, p.id, ev.target.result as string, file.name);
                    handleShowPdf(modalUser); 
                }
                setIsLoading(false);
             }, 1500);
         };
         reader.readAsDataURL(file);
     }
  };

  // Helper for Planetary Rows
  const PlanetRow = ({ label, planetKey, designData, personalityData, isEditing, onChange }: any) => (
      <div className="grid grid-cols-6 text-sm border-b last:border-b-0">
          <div className="col-span-2 p-1.5 bg-red-600 text-white text-center font-mono border-r border-white relative font-bold text-xs flex items-center justify-center">
              {isEditing ? (
                  <input 
                    value={designData?.[planetKey] || ''} 
                    onChange={e => onChange('design', planetKey, e.target.value)} 
                    className="w-full text-center bg-white text-black border rounded px-1 text-xs"
                    placeholder="e.g. 45.3 ▲"
                  />
              ) : (
                  designData?.[planetKey] || '-'
              )}
          </div>
          <div className="col-span-2 p-1.5 bg-gray-100 flex items-center justify-center text-gray-800 text-lg">
              {label}
          </div>
          <div className="col-span-2 p-1.5 bg-black text-white text-center font-mono border-l border-white relative font-bold text-xs flex items-center justify-center">
              {isEditing ? (
                  <input 
                    value={personalityData?.[planetKey] || ''} 
                    onChange={e => onChange('personality', planetKey, e.target.value)} 
                    className="w-full text-center bg-white text-black border rounded px-1 text-xs"
                    placeholder="e.g. 45.3 ▼"
                  />
              ) : (
                  personalityData?.[planetKey] || '-'
              )}
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50 gap-4">
           <h3 className="font-bold text-gray-800">{t.memberDir}</h3>
           <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                 <span className="absolute left-3 top-2.5 text-gray-400"><Icons.Search /></span>
                 <input 
                    type="text" 
                    placeholder={t.searchMember} 
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                 />
             </div>
             <div className="flex gap-2">
                 <span className="text-sm text-gray-500 self-center hidden md:inline">{t.rows}:</span>
                 <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="border border-gray-300 rounded-md text-sm px-2 py-1 outline-none">
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                   <option value={50}>50</option>
                 </select>
             </div>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 w-10">#</th>
                <th className="px-6 py-4">{t.memberInfo}</th>
                <th className="px-6 py-4">{t.referralCode}</th>
                <th className="px-6 py-4">{t.sponsor}</th>
                <th className="px-6 py-4">{t.status}</th>
                <th className="px-6 py-4 text-center">{t.purchased}</th>
                <th className="px-6 py-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {memberList.slice(0, limit).map((m, idx) => (
                <tr key={m.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {m.avatar ? <img src={m.avatar} className="h-8 w-8 rounded-full object-cover mr-3 bg-gray-200" /> : <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">{m.name.charAt(0).toUpperCase()}</div>}
                      <div><div className="text-sm font-medium text-gray-900">{m.name}</div><div className="text-xs text-gray-500">{m.email}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{m.referralCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getSponsorName(m.uplineId)}</td>
                  <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded font-bold ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.isActive ? t.active : t.inactive}</span></td>
                  <td className="px-6 py-4 text-center">
                      <button onClick={() => handleShowPdf(m)} className="text-gray-500 hover:text-blue-600 p-2"><Icons.Document /></button>
                  </td>
                  <td className="px-6 py-4 text-center flex gap-2 justify-center">
                    <button onClick={() => handleOpenOCR(m)} className="text-purple-600 hover:bg-purple-50 p-1.5 rounded" title={t.ocr}><Icons.Scan /></button>
                    <button onClick={() => handleViewUser(m)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded" title={t.view}><Icons.Eye /></button>
                    <button onClick={() => handleToggleStatus(m.id)} className={`${m.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'} p-1.5 rounded`} title={m.isActive ? t.suspend : t.activate}>{m.isActive ? <Icons.Ban /> : <Icons.Check />}</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded" title={t.delete}><Icons.Trash /></button>
                    <button onClick={() => handleToggleKaka(m.id)} className={`${m.isKakaUnlocked ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'} p-1.5 rounded border border-transparent hover:border-gray-200`} title={m.isKakaUnlocked ? 'Lock Info KAKA' : 'Unlock Info KAKA'}>
                        {m.isKakaUnlocked ? <Icons.Unlock /> : <Icons.Lock />}
                    </button>
                  </td>
                </tr>
              ))}
              {memberList.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">No members found matching "{searchQuery}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected User Modal with Edit Support */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-lg">{isEditingUser ? 'Edit Member' : 'Member Details'}</h3>
              <button onClick={() => setSelectedUser(null)}><Icons.X /></button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
               <div className="text-center pb-4 border-b">
                 {selectedUser.avatar ? <img src={selectedUser.avatar} className="h-20 w-20 rounded-full mx-auto mb-2 object-cover border-4 border-white shadow" /> : <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2">{selectedUser.name.charAt(0)}</div>}
                 
                 {isEditingUser ? (
                     <div className="space-y-2 mt-2">
                         <input value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} className="border p-1 rounded w-full text-center font-bold" placeholder="Name" />
                         <input value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} className="border p-1 rounded w-full text-center text-sm" placeholder="Email" />
                     </div>
                 ) : (
                     <>
                        <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                        <p className="text-gray-500">{selectedUser.email}</p>
                     </>
                 )}
                 <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${selectedUser.kyc.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{selectedUser.kyc.isVerified ? 'KYC Verified' : 'Unverified'}</span>
               </div>

               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="col-span-2"><h4 className="font-bold text-gray-800 border-b pb-1 mb-2 mt-2">Personal Details</h4></div>
                 
                 {/* KYC Fields (Gender, Birth, Contact, etc - collapsed for brevity as they are same as before) */}
                 <div>
                     <p className="text-gray-500 mb-1">Gender</p>
                     {isEditingUser ? (
                         <select value={editUserData.gender} onChange={e => setEditUserData({...editUserData, gender: e.target.value})} className="border p-1 rounded w-full">
                             <option value="Man">Man</option>
                             <option value="Woman">Woman</option>
                         </select>
                     ) : <p className="font-medium">{selectedUser.kyc.gender || '-'}</p>}
                 </div>
                 <div>
                     <p className="text-gray-500 mb-1">Birth Date</p>
                     {isEditingUser ? <input type="date" value={editUserData.birthDate} onChange={e => setEditUserData({...editUserData, birthDate: e.target.value})} className="border p-1 rounded w-full" /> : <p className="font-medium">{selectedUser.kyc.birthDate || '-'}</p>}
                 </div>
                 <div>
                     <p className="text-gray-500 mb-1">Birth Time</p>
                     {isEditingUser ? <input type="time" value={editUserData.birthTime} onChange={e => setEditUserData({...editUserData, birthTime: e.target.value})} className="border p-1 rounded w-full" /> : <p className="font-medium">{selectedUser.kyc.birthTime || '-'}</p>}
                 </div>
                 <div className="relative z-10">
                     <p className="text-gray-500 mb-1">Birth City</p>
                     {isEditingUser ? <CityAutocomplete value={editUserData.birthCity} onChange={(val) => setEditUserData({...editUserData, birthCity: val})} /> : <p className="font-medium">{selectedUser.kyc.birthCity || '-'}</p>}
                 </div>
                 
                 <div className="col-span-2"><h4 className="font-bold text-gray-800 border-b pb-1 mb-2 mt-4">Contact & Bank</h4></div>
                 <div>
                     <p className="text-gray-500 mb-1">Phone</p>
                     {isEditingUser ? <input value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})} className="border p-1 rounded w-full" /> : <p className="font-medium">{selectedUser.kyc.phone || '-'}</p>}
                 </div>
                 <div>
                     <p className="text-gray-500 mb-1">Bank</p>
                     {isEditingUser ? <input value={editUserData.bankName} onChange={e => setEditUserData({...editUserData, bankName: e.target.value})} className="border p-1 rounded w-full" /> : <p className="font-medium">{selectedUser.kyc.bankName || '-'}</p>}
                 </div>
                 <div>
                     <p className="text-gray-500 mb-1">Account No</p>
                     {isEditingUser ? <input value={editUserData.accountNumber} onChange={e => setEditUserData({...editUserData, accountNumber: e.target.value})} className="border p-1 rounded w-full" /> : <p className="font-medium">{selectedUser.kyc.accountNumber || '-'}</p>}
                 </div>
                 <div>
                     <p className="text-gray-500 mb-1">Address</p>
                     {isEditingUser ? <input value={editUserData.address} onChange={e => setEditUserData({...editUserData, address: e.target.value})} className="border p-1 rounded w-full" /> : <p className="font-medium">{selectedUser.kyc.address || '-'}</p>}
                 </div>

                 {/* Human Design Section */}
                 {!isEditingUser && (
                     <div className="col-span-2 mt-4">
                         <button 
                            onClick={() => setShowHumanDesignTable(!showHumanDesignTable)}
                            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 border border-purple-200"
                         >
                             <Icons.Scan /> {t.humanDesign}
                         </button>
                         
                         {showHumanDesignTable && (
                             <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up">
                                 {currentUserHumanDesign ? (
                                     <div className="bg-white">
                                         <div className="p-3 bg-purple-100 text-purple-800 font-bold flex justify-between items-center text-sm">
                                             <span>Blueprint Data</span>
                                             {isEditingHD ? (
                                                 <div className="flex gap-2">
                                                     <button onClick={handleSaveHD} className="bg-emerald-500 text-white px-3 py-1 rounded hover:bg-emerald-600">Save</button>
                                                     <button onClick={() => setIsEditingHD(false)} className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400">Cancel</button>
                                                 </div>
                                             ) : (
                                                 <button onClick={() => { setIsEditingHD(true); setEditHDData(currentUserHumanDesign); }} className="bg-white text-purple-700 px-3 py-1 rounded border border-purple-200 hover:bg-purple-50">Edit Profile</button>
                                             )}
                                         </div>

                                         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                             {/* LEFT COLUMN: Chart Image & Red (Design) Planets */}
                                             <div className="space-y-4">
                                                 {/* Chart */}
                                                 <div className="relative group w-full text-center">
                                                     {isEditingHD ? (
                                                         <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50 cursor-pointer hover:bg-purple-100">
                                                             <p className="text-xs text-purple-600 font-bold mb-2">Change Chart Image</p>
                                                             <input type="file" accept="image/*" onChange={handleHDImageUpdate} className="text-xs w-full" />
                                                             {editHDData.chartImage && <img src={editHDData.chartImage} className="max-h-64 mt-2 mx-auto object-contain" alt="Preview" />}
                                                         </div>
                                                     ) : (
                                                         currentUserHumanDesign.chartImage ? (
                                                             <img src={currentUserHumanDesign.chartImage} alt="Chart" className="max-h-96 w-full object-contain rounded" />
                                                         ) : (
                                                             <div className="h-64 w-full bg-gray-100 flex items-center justify-center text-gray-400 italic">No Chart Image</div>
                                                         )
                                                     )}
                                                 </div>
                                                 
                                                 {/* Planetary Grid */}
                                                 <div>
                                                     <div className="grid grid-cols-6 text-xs font-bold uppercase bg-gray-100 border-b">
                                                         <div className="col-span-2 text-center p-1.5 text-red-600 bg-white">Design</div>
                                                         <div className="col-span-2 text-center p-1.5">Planet</div>
                                                         <div className="col-span-2 text-center p-1.5 text-black bg-white">Personality</div>
                                                     </div>
                                                     <div className="border-l border-r border-b">
                                                         {[
                                                             { k: 'sun', l: '☉' }, { k: 'earth', l: '⊕' }, { k: 'northNode', l: '☊' },
                                                             { k: 'southNode', l: '☋' }, { k: 'moon', l: '☽' }, { k: 'mercury', l: '☿' },
                                                             { k: 'venus', l: '♀' }, { k: 'mars', l: '♂' }, { k: 'jupiter', l: '♃' },
                                                             { k: 'saturn', l: '♄' }, { k: 'uranus', l: '♅' }, { k: 'neptune', l: '♆' },
                                                             { k: 'pluto', l: '♇' }, { k: 'chiron', l: 'k' }, { k: 'lilith', l: '☾' }
                                                         ].map(p => (
                                                             <PlanetRow 
                                                                key={p.k} 
                                                                label={p.l} 
                                                                planetKey={p.k} 
                                                                designData={isEditingHD ? editHDData.design : currentUserHumanDesign.design} 
                                                                personalityData={isEditingHD ? editHDData.personality : currentUserHumanDesign.personality}
                                                                isEditing={isEditingHD}
                                                                onChange={(type: 'design'|'personality', key: string, val: string) => {
                                                                    setEditHDData({
                                                                        ...editHDData,
                                                                        [type]: {
                                                                            ...editHDData[type],
                                                                            [key]: val
                                                                        }
                                                                    });
                                                                }}
                                                             />
                                                         ))}
                                                     </div>
                                                 </div>
                                             </div>

                                             {/* RIGHT COLUMN: Bio Data & Details */}
                                             <div className="space-y-1 text-sm">
                                                 <div className="bg-gray-50 p-2 rounded border border-gray-100 mb-3">
                                                     <h5 className="font-bold text-gray-800 text-xs uppercase border-b mb-2 pb-1">Biodata Chart</h5>
                                                     {[
                                                         { l: 'Nama', k: 'chartName' },
                                                         { l: 'Tanggal Lahir', k: 'chartBirthDate', type: 'date' },
                                                         { l: 'Tempat Lahir', k: 'chartBirthCity' },
                                                         { l: 'Jam Lahir', k: 'chartBirthTime', type: 'time' },
                                                     ].map(f => (
                                                         <div key={f.k} className="flex justify-between py-1 border-b border-gray-200 last:border-0 text-xs">
                                                             <span className="text-gray-500 font-bold">{f.l}:</span>
                                                             {isEditingHD ? (
                                                                 <input type={f.type || 'text'} value={(editHDData as any)[f.k] || ''} onChange={e => setEditHDData({...editHDData, [f.k]: e.target.value})} className="text-right border-b w-2/3 bg-white"/>
                                                             ) : (
                                                                 <span>{(currentUserHumanDesign as any)[f.k] || '-'}</span>
                                                             )}
                                                         </div>
                                                     ))}
                                                 </div>

                                                 <h5 className="font-bold text-gray-800 text-xs uppercase border-b mb-2 pb-1 mt-4">Profile Details</h5>
                                                 {[
                                                     { l: 'Tipe', k: 'type' },
                                                     { l: 'Strategi', k: 'strategy' },
                                                     { l: 'Otoritas Batin', k: 'authority' },
                                                     { l: 'Tujuan Utama', k: 'signature' }, // Satisfaction
                                                     { l: 'Tema Emosional', k: 'notSelfTheme' }, // Frustration
                                                     { l: 'Definisi', k: 'definition' },
                                                     { l: 'Profil', k: 'profile' },
                                                     { l: 'Sistem Pencernaan', k: 'digestion' },
                                                     { l: 'Kepekaan Sadar', k: 'sense' },
                                                     { l: 'Motivasi', k: 'motivation' },
                                                     { l: 'Perspektif', k: 'perspective' },
                                                     { l: 'Lingkungan', k: 'environment' },
                                                     { l: 'Misi Jiwa', k: 'incarnationCross' },
                                                 ].map(field => (
                                                     <div key={field.k} className="flex justify-between py-1 border-b border-dashed border-gray-200 text-xs items-start">
                                                         <span className="text-gray-600 font-bold whitespace-nowrap mr-2">{field.l}:</span>
                                                         {isEditingHD ? (
                                                             <input 
                                                                value={(editHDData as any)[field.k] || ''} 
                                                                onChange={e => setEditHDData({...editHDData, [field.k]: e.target.value})}
                                                                className="text-right border-b border-gray-300 focus:border-purple-500 outline-none w-full"
                                                             />
                                                         ) : (
                                                             <span className="text-gray-900 font-medium text-right break-words max-w-[60%]">{(currentUserHumanDesign as any)[field.k] || '-'}</span>
                                                         )}
                                                     </div>
                                                 ))}

                                                 {/* Centers */}
                                                 <div className="mt-4">
                                                     <h5 className="font-bold text-gray-800 border-b pb-1 text-xs uppercase mb-2">9 Pusat Energi</h5>
                                                     <div className="grid grid-cols-2 gap-1 text-[10px]">
                                                         {['head', 'ajna', 'throat', 'gCenter', 'heart', 'sacral', 'root', 'spleen', 'solarPlexus'].map(center => (
                                                             <div key={center} className="flex justify-between items-center bg-gray-50 p-1 px-2 rounded">
                                                                 <span className="capitalize text-gray-600">{center.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                                 {isEditingHD ? (
                                                                     <select 
                                                                        value={editHDData.centers?.[center as keyof HDCenters] || 'Open'} 
                                                                        onChange={e => setEditHDData({
                                                                            ...editHDData, 
                                                                            centers: { ...editHDData.centers!, [center]: e.target.value }
                                                                        })}
                                                                        className="border rounded text-[10px] p-0"
                                                                     >
                                                                         <option value="Defined">Defined</option>
                                                                         <option value="Undefined">Undefined</option>
                                                                         <option value="Open">Open</option>
                                                                     </select>
                                                                 ) : (
                                                                     <span className={`font-bold ${currentUserHumanDesign.centers?.[center as keyof HDCenters] === 'Defined' ? 'text-green-600' : 'text-gray-400'}`}>
                                                                         {currentUserHumanDesign.centers?.[center as keyof HDCenters] || '-'}
                                                                     </span>
                                                                 )}
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>

                                                 {/* Channels */}
                                                 <div className="mt-4">
                                                     <h5 className="font-bold text-gray-800 border-b pb-1 text-xs uppercase mb-2">Jalur Potensi / Channels</h5>
                                                     {isEditingHD ? (
                                                         <textarea 
                                                            className="w-full border rounded text-xs p-2" 
                                                            rows={3} 
                                                            placeholder="Format: 34-10 : Name"
                                                            value={Array.isArray(editHDData.channels) ? editHDData.channels.join('\n') : ''}
                                                            onChange={e => setEditHDData({...editHDData, channels: e.target.value.split('\n')})}
                                                         />
                                                     ) : (
                                                         <div className="flex flex-col gap-1">
                                                             {currentUserHumanDesign.channels && currentUserHumanDesign.channels.length > 0 ? (
                                                                 currentUserHumanDesign.channels.map((ch, i) => (
                                                                     <span key={i} className="bg-purple-50 text-purple-900 px-2 py-1 rounded text-[10px] font-medium border border-purple-100">{ch}</span>
                                                                 ))
                                                             ) : <span className="text-gray-400 text-xs italic">No channels recorded</span>}
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="p-6 text-center text-gray-500 italic">No Human Design Profile data found. Use OCR Action to add.</div>
                                 )}
                             </div>
                         )}
                     </div>
                 )}
               </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 shrink-0 flex justify-between">
                {isEditingUser ? (
                    <button onClick={() => setIsEditingUser(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancel</button>
                ) : (
                    <button onClick={() => setIsEditingUser(true)} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-bold text-blue-700 flex items-center gap-1"><Icons.Ticket /> Edit Member</button>
                )}
                
                {isEditingUser ? (
                    <button onClick={handleSaveUser} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold text-white">Save Changes</button>
                ) : (
                    <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700">Close</button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* OCR MODAL */}
      {showOCRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowOCRModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="bg-purple-900 px-6 py-4 flex justify-between items-center text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Icons.Scan /> OCR Human Design</h3>
                      <button onClick={() => setShowOCRModal(false)}><Icons.X /></button>
                  </div>
                  
                  <div className="p-6">
                      {ocrStep === 'UPLOAD' && (
                          <div className="text-center space-y-4">
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-purple-500 transition-colors">
                                  <Icons.Document />
                                  <p className="text-sm text-gray-500 mt-2">Upload BodyGraph Image or PDF</p>
                                  <input type="file" accept="image/*,application/pdf" onChange={handleOCRFileUpload} className="hidden" id="ocr-upload" />
                                  <label htmlFor="ocr-upload" className="mt-4 inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-purple-200">
                                      Select Media
                                  </label>
                              </div>
                          </div>
                      )}

                      {ocrStep === 'SCANNING' && (
                          <div className="text-center py-8">
                              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-purple-700 font-bold animate-pulse">Auto-Cropping & Extracting Data...</p>
                          </div>
                      )}

                      {ocrStep === 'READY' && (
                          <div className="text-center space-y-4">
                              <div className="bg-gray-100 p-4 rounded-lg">
                                  {ocrFileUrl ? (
                                      <img src={ocrFileUrl} className="max-h-40 mx-auto object-contain rounded" alt="Preview" />
                                  ) : (
                                      <div className="h-40 flex items-center justify-center text-gray-400">Preview</div>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2 truncate">{ocrFileName}</p>
                              </div>
                              <button onClick={handleScan} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-lg flex justify-center items-center gap-2">
                                  <Icons.Scan /> {t.scanImage}
                              </button>
                          </div>
                      )}

                      {ocrStep === 'RESULT' && (
                          <div className="space-y-4">
                              <div className="bg-purple-50 p-3 rounded text-center text-sm font-bold text-purple-800 mb-2">Scan Successful!</div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                      <label className="text-xs text-gray-500">Name</label>
                                      <input value={scannedProfile.chartName || ''} onChange={e => setScannedProfile({...scannedProfile, chartName: e.target.value})} className="border p-2 rounded w-full" />
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500">Profile</label>
                                      <input value={scannedProfile.profile || ''} onChange={e => setScannedProfile({...scannedProfile, profile: e.target.value})} className="border p-2 rounded w-full" />
                                  </div>
                                  <div className="col-span-2">
                                      <label className="text-xs text-gray-500">Authority</label>
                                      <input value={scannedProfile.authority || ''} onChange={e => setScannedProfile({...scannedProfile, authority: e.target.value})} className="border p-2 rounded w-full" />
                                  </div>
                                  <div className="col-span-2">
                                      <p className="text-xs text-green-600 italic">Planetary Data, Centers & Channels extracted successfully.</p>
                                  </div>
                              </div>
                              <button onClick={handleSaveOCR} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg mt-4">
                                  Save Extracted Profile
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {showPdfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPdfModal(false)}>
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
                  {/* ... (Keep existing PDF Modal Content) ... */}
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Purchased Files</h3>
                      <button onClick={() => setShowPdfModal(false)}><Icons.X /></button>
                  </div>
                  
                  <form onSubmit={handleGrantAccess} className="bg-blue-50 p-4 rounded mb-6 border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                          <Icons.Ticket /> {editingProductId ? 'Update File' : 'Upload File for Member'}
                      </h4>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handleFileUpload} 
                        className="w-full text-sm border p-2 rounded mb-3 bg-white"
                        required={!editingProductId}
                      />
                      {isLoading && (
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4"></div>
                          </div>
                      )}
                      <input 
                        placeholder="File Name (e.g. Bonus PDF)" 
                        className="w-full text-sm border p-2 rounded mb-3" 
                        value={newFileName} 
                        onChange={e => setNewFileName(e.target.value)} 
                        required 
                      />
                      <div className="flex gap-2">
                        {editingProductId && <button type="button" onClick={() => { setEditingProductId(null); setNewFileName(''); setNewFileUrl(''); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-xs font-bold">Cancel</button>}
                        <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded disabled:opacity-50">{editingProductId ? 'Save Changes' : 'Upload & Grant Access'}</button>
                      </div>
                  </form>

                  {userProducts.length === 0 ? (
                      <p className="text-gray-500 text-center text-sm py-4">No products purchased yet.</p>
                  ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                          {userProducts.map(p => (
                              <div key={p.id} className="border p-3 rounded flex justify-between items-center bg-gray-50">
                                  <div className="flex-1 min-w-0 mr-3">
                                      <p className="font-bold text-sm truncate">{p.name}</p>
                                      {p.pdfUrl ? <span className="text-xs text-green-600 font-medium">Available</span> : <span className="text-xs text-gray-400">No PDF</span>}
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                      {p.pdfUrl && (
                                          <a 
                                            href={p.pdfUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-blue-600 p-2 hover:bg-blue-100 rounded flex flex-col items-center" 
                                            title="View"
                                          >
                                              <Icons.Document />
                                              <span className="text-[10px] font-bold">View</span>
                                          </a>
                                      )}
                                      <label className="cursor-pointer text-orange-500 p-2 hover:bg-orange-100 rounded" title="Change File">
                                         <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleEditFileUpload(e, p)} />
                                         <Icons.Ticket />
                                      </label>
                                      <button onClick={() => handleDeleteAccess(p.id)} className="text-red-500 p-2 hover:bg-red-100 rounded" title="Delete Access">
                                          <Icons.Trash />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

                  <div className="flex justify-center border-t pt-4">
                      <button 
                        onClick={() => setShowPdfModal(false)} 
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
                      >
                          Save & Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MemberManagement;
