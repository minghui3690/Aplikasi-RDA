
import React, { useState } from 'react';
import { requestWithdrawal, getWithdrawals, processWithdrawal } from '../services/mockDatabase';
import { User, UserRole, WithdrawalRequest } from '../types';
import { Icons } from '../constants';
import CommissionTable from './CommissionTable';

interface WithdrawalProps {
  user: User;
  onRefresh: () => void;
}

const Withdrawal: React.FC<WithdrawalProps> = ({ user, onRefresh }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(getWithdrawals());

  // Admin Processing State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string>('');
  const [proofLink, setProofLink] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  
  // Member Viewing State
  const [viewProof, setViewProof] = useState<WithdrawalRequest | null>(null);

  // Admin Commission View State
  const [showAdminCommissions, setShowAdminCommissions] = useState(false);

  const openApproveModal = (id: string) => {
      setProcessingId(id);
      setProofImage('');
      setProofLink('');
  };

  const openRejectModal = (id: string) => {
      setRejectingId(id);
      setProofImage('');
      setProofLink('');
      setRejectReason('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (x) => {
              if(x.target?.result) setProofImage(x.target.result as string);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const confirmApproval = () => {
    if (processingId) {
        processWithdrawal(processingId, 'APPROVED', proofImage, proofLink);
        setWithdrawals(getWithdrawals());
        setProcessingId(null);
    }
  };

  const confirmRejection = () => {
      if (rejectingId) {
          if (!rejectReason) {
              alert('Please provide a rejection reason.');
              return;
          }
          processWithdrawal(rejectingId, 'REJECTED', proofImage, proofLink, rejectReason);
          setWithdrawals(getWithdrawals());
          setRejectingId(null);
      }
  };

  if (isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Withdrawal Requests</h3>
            <button 
                onClick={() => setShowAdminCommissions(true)}
                className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-200 flex items-center gap-2"
            >
                <Icons.Money /> Commissions
            </button>
        </div>

        <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Bank Details</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map(w => (
                <tr key={w.id}>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(w.requestDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{w.userName}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px] truncate">{w.bankDetails}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">Rp {w.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : w.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {w.status === 'PENDING' ? (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openApproveModal(w.id)} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs border border-green-200 font-bold">Approve</button>
                        <button onClick={() => openRejectModal(w.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs border border-red-200 font-bold">Reject</button>
                      </div>
                    ) : (
                       <button onClick={() => setViewProof(w)} className="text-blue-600 hover:underline text-xs">View Details</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>

        {/* Approval Modal */}
        {processingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                    <h3 className="font-bold text-lg mb-4 text-green-700">Approve Withdrawal</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Upload Proof (Image)</label>
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="w-full text-sm" />
                            {proofImage && <img src={proofImage} alt="Preview" className="mt-2 h-20 object-cover rounded border" />}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">External Link (Optional)</label>
                            <input 
                                value={proofLink} 
                                onChange={e => setProofLink(e.target.value)} 
                                placeholder="https://..." 
                                className="w-full border p-2 rounded text-sm" 
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setProcessingId(null)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                        <button onClick={confirmApproval} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold">Confirm Transfer</button>
                    </div>
                </div>
            </div>
        )}

        {/* Rejection Modal */}
        {rejectingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                    <h3 className="font-bold text-lg mb-4 text-red-700">Reject Withdrawal</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Rejection Reason</label>
                            <textarea 
                                value={rejectReason} 
                                onChange={e => setRejectReason(e.target.value)} 
                                placeholder="Explain why this request is rejected..." 
                                className="w-full border p-2 rounded text-sm h-24" 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Attach Image (Optional)</label>
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="w-full text-sm" />
                            {proofImage && <img src={proofImage} alt="Preview" className="mt-2 h-20 object-cover rounded border" />}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Reference Link (Optional)</label>
                            <input 
                                value={proofLink} 
                                onChange={e => setProofLink(e.target.value)} 
                                placeholder="https://..." 
                                className="w-full border p-2 rounded text-sm" 
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setRejectingId(null)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                        <button onClick={confirmRejection} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold">Confirm Reject</button>
                    </div>
                </div>
            </div>
        )}

        {/* View Details Modal Admin Side */}
        {viewProof && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewProof(null)}>
                 <div className="bg-white rounded-xl p-6 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                     <button onClick={() => setViewProof(null)} className="absolute top-4 right-4"><Icons.X /></button>
                     <h3 className="font-bold mb-4">Request Details</h3>
                     <div className="space-y-4">
                         {viewProof.status === 'REJECTED' && (
                             <div className="bg-red-50 p-3 rounded border border-red-100">
                                 <p className="text-xs font-bold text-red-800">Rejection Reason:</p>
                                 <p className="text-sm">{viewProof.rejectionReason || 'No reason provided'}</p>
                             </div>
                         )}
                         {viewProof.adminProofImage ? (
                             <img src={viewProof.adminProofImage} className="w-full rounded mb-4" />
                         ) : (
                             <p className="text-gray-500 italic mb-4">No image uploaded.</p>
                         )}
                         {viewProof.adminProofLink && (
                             <a href={viewProof.adminProofLink} target="_blank" rel="noreferrer" className="text-blue-600 underline block break-all">
                                 {viewProof.adminProofLink}
                             </a>
                         )}
                     </div>
                 </div>
             </div>
        )}

        {/* Admin Commission View Modal */}
        {showAdminCommissions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdminCommissions(false)}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
                        <h3 className="font-bold text-lg">Admin Commissions & Wallet</h3>
                        <button onClick={() => setShowAdminCommissions(false)}><Icons.X /></button>
                    </div>
                    <div className="p-6">
                        <CommissionTable user={user} />
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return null;
};

export default Withdrawal;
