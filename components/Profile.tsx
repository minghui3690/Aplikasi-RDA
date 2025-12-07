
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { updateUserProfile, getSettings, saveSettings } from '../services/mockDatabase';
import { Icons } from '../constants';
import CityAutocomplete from './CityAutocomplete';

interface ProfileProps {
  user: User;
  onUpdate: () => void;
  onNavigate: (path: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onNavigate }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const settings = getSettings();
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.kyc.phone,
    address: user.kyc.address,
    bankName: user.kyc.bankName,
    accountNumber: user.kyc.accountNumber,
    accountHolder: user.kyc.accountHolder,
    gender: user.kyc.gender || 'Man',
    birthDate: user.kyc.birthDate || '',
    birthCity: user.kyc.birthCity || '',
    birthTime: user.kyc.birthTime || '',
    avatar: user.avatar || ''
  });

  // Admin Midtrans Config State
  const [midtransConfig, setMidtransConfig] = useState(settings.paymentConfig.midtrans);
  
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save User Profile
    updateUserProfile(user.id, {
      name: formData.name,
      email: formData.email,
      avatar: formData.avatar,
      kyc: { 
          ...user.kyc, 
          phone: formData.phone,
          address: formData.address,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
          gender: formData.gender as any,
          birthDate: formData.birthDate,
          birthCity: formData.birthCity,
          birthTime: formData.birthTime
      }
    });

    // Save Admin Payment Config if Admin
    if (isAdmin) {
        const newSettings = { 
            ...settings, 
            paymentConfig: { 
                ...settings.paymentConfig, 
                midtrans: midtransConfig 
            } 
        };
        saveSettings(newSettings);
    }

    alert('Profile Saved Successfully!');
    onUpdate();
    onNavigate('/dashboard'); 
  };

  const handleChangePassword = () => {
    if (!newPassword) return;
    updateUserProfile(user.id, { password: newPassword });
    setMsg('Password Changed Successfully! Please save changes or return to dashboard.');
    setNewPassword('');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (x) => {
              if (x.target?.result) setFormData({ ...formData, avatar: x.target.result as string });
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
      <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center rounded-t-xl">
        <div>
           <h2 className="text-2xl font-bold">Profile & KYC</h2>
           <p className="text-slate-400">Manage your account and billing information</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
         {/* Avatar Section */}
         <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer">
                {formData.avatar ? (
                    <img src={formData.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-md" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold border-4 border-gray-100 shadow-md">
                        {user.name.charAt(0)}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Camera />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Click to upload photo</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">Personal Info</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Editable)</label>
              <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full border p-2 rounded-lg">
                  <option value="Man">Man</option>
                  <option value="Woman">Woman</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
              <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth City</label>
              <CityAutocomplete 
                value={formData.birthCity} 
                onChange={(val) => setFormData({...formData, birthCity: val})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Time (24h)</label>
              <input type="time" value={formData.birthTime} onChange={e => setFormData({...formData, birthTime: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded-lg" rows={2} />
            </div>

            <div className="md:col-span-2 pt-4">
               <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">Bank Information (Withdrawal)</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="BCA / Mandiri / etc" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input value={formData.accountHolder} onChange={e => setFormData({...formData, accountHolder: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>

            {/* Admin Payment Gateway Config */}
            {isAdmin && (
                <>
                    <div className="md:col-span-2 pt-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">PAYMENT GATEWAY CONFIGURATION (MIDTRANS)</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                        <input value={midtransConfig.merchantId} onChange={e => setMidtransConfig({...midtransConfig, merchantId: e.target.value})} className="w-full border p-2 rounded-lg font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Key</label>
                        <input value={midtransConfig.clientKey} onChange={e => setMidtransConfig({...midtransConfig, clientKey: e.target.value})} className="w-full border p-2 rounded-lg font-mono text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Server Key</label>
                        <input value={midtransConfig.serverKey} onChange={e => setMidtransConfig({...midtransConfig, serverKey: e.target.value})} className="w-full border p-2 rounded-lg font-mono text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Snap URL</label>
                        <input value={midtransConfig.snapUrl} onChange={e => setMidtransConfig({...midtransConfig, snapUrl: e.target.value})} className="w-full border p-2 rounded-lg font-mono text-sm" />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                        <input type="checkbox" checked={midtransConfig.isProduction} onChange={e => setMidtransConfig({...midtransConfig, isProduction: e.target.checked})} className="w-4 h-4" />
                        <label className="text-sm font-medium text-gray-700">Is Production Mode?</label>
                    </div>
                </>
            )}

            <div className="md:col-span-2 pt-4 flex justify-between items-center">
               <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Security</h3>
               <button type="button" onClick={() => setPasswordModal(true)} className="text-blue-600 text-sm font-bold hover:underline">Change Password</button>
            </div>
         </div>

         <div className="pt-4 flex justify-end gap-3">
           <button type="button" onClick={() => onNavigate('/dashboard')} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold">
             Cancel
           </button>
           <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all">
             Save Changes
           </button>
         </div>
      </form>

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <h3 className="font-bold text-lg mb-4">Change Password</h3>
                {msg ? (
                    <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{msg}</div>
                ) : (
                    <div className="mb-4">
                        <label className="block text-sm mb-1">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded" />
                    </div>
                )}
                <div className="flex justify-end gap-2">
                    <button onClick={() => { setPasswordModal(false); setMsg(''); }} className="text-gray-500 px-4 py-2">Close</button>
                    {!msg && <button onClick={handleChangePassword} className="bg-blue-600 text-white px-4 py-2 rounded">Update</button>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
