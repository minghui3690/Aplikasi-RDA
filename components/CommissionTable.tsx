
import React, { useState } from 'react';
import { getCommissions, getUsers, getSettings, requestWithdrawal, getWithdrawals } from '../services/mockDatabase';
import { User, CommissionLog, WithdrawalRequest } from '../types';
import { TRANSLATIONS, Icons } from '../constants';

interface Props {
  user: User;
  currentLang?: string;
  onNavigate?: (path: string) => void;
}

const CommissionTable: React.FC<Props> = ({ user, currentLang = 'EN', onNavigate }) => {
  const commissions = getCommissions().filter(c => c.beneficiaryId === user.id);
  const users = getUsers();
  const settings = getSettings();
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['EN'];

  // Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(getWithdrawals());
  const [msg, setMsg] = useState('');
  const [viewProof, setViewProof] = useState<WithdrawalRequest | null>(null);

  const getSourceName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown User';

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate max amount in Rp based on points
      const maxRp = user.walletBalance * settings.pointRate;
      
      if (amount > maxRp) {
          throw new Error(`Insufficient balance. Max: Rp ${maxRp.toLocaleString()}`);
      }
      
      requestWithdrawal(user.id, amount);
      setMsg('Withdrawal requested successfully.');
      setAmount(0);
      setWithdrawals(getWithdrawals());
      // Force refresh user data in parent usually needed, but here we update local logic visually for now
      user.walletBalance -= (amount / settings.pointRate); 
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    }
  };

  const myWithdrawals = withdrawals.filter(w => w.userId === user.id);
  const availableBalanceRp = user.walletBalance * settings.pointRate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <h2 className="text-2xl font-bold text-gray-800">{t.commissions}</h2>
         <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold shadow-sm">
                {t.totalEarned}: {user.totalEarnings.toLocaleString()} Pts
            </div>
            <button 
                onClick={() => setShowWithdrawModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors"
            >
                <Icons.Wallet /> {t.withdrawBtn}
            </button>
         </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {commissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
             {t.noCommissions}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                   <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                       <th className="px-6 py-4">{t.date}</th>
                       <th className="px-6 py-4">{t.sourceMember}</th>
                       <th className="px-6 py-4">{t.level}</th>
                       <th className="px-6 py-4 text-right">{t.amountPts}</th>
                       <th className="px-6 py-4 text-right">{t.valueRp}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {commissions.map(c => (
                       <tr key={c.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4 text-sm text-gray-600">{new Date(c.timestamp).toLocaleDateString()}</td>
                           <td className="px-6 py-4 font-medium text-gray-900">{getSourceName(c.sourceUserId)}</td>
                           <td className="px-6 py-4">
                               <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Lvl {c.level}</span>
                           </td>
                           <td className="px-6 py-4 text-right font-bold text-emerald-600">+{c.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                           <td className="px-6 py-4 text-right font-medium text-gray-600">
                               Rp {(c.amount * settings.pointRate).toLocaleString(undefined, {minimumFractionDigits: 2})}
                           </td>
                       </tr>
                   ))}
                </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WALLET & WITHDRAWAL MODAL */}
      {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Icons.Wallet /> {t.walletAndWithdraw}</h3>
                      <button onClick={() => setShowWithdrawModal(false)} className="hover:text-gray-300"><Icons.X /></button>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Side: Balance & Request */}
                      <div className="space-y-6">
                           <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                               <p className="text-blue-600 font-bold uppercase text-xs tracking-wider mb-2">{t.availableBalance}</p>
                               <h2 className="text-3xl font-extrabold text-blue-900">Rp {availableBalanceRp.toLocaleString()}</h2>
                               <p className="text-xs text-blue-400 mt-1">({user.walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} Pts)</p>
                           </div>

                           {msg && (
                               <div className={`p-3 rounded text-sm flex justify-between items-center ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                   <span>{msg}</span>
                                   {msg.includes('Bank Details') && onNavigate && (
                                       <button onClick={() => onNavigate('profile')} className="text-xs font-bold underline bg-white px-2 py-1 rounded shadow-sm border">
                                           Go to Profile
                                       </button>
                                   )}
                               </div>
                           )}

                           <form onSubmit={handleRequest} className="space-y-4 border p-4 rounded-xl">
                               <h4 className="font-bold text-gray-800">{t.reqWithdraw}</h4>
                               <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rp)</label>
                                   <input 
                                      type="number" 
                                      min="10000" 
                                      max={availableBalanceRp}
                                      value={amount}
                                      onChange={e => setAmount(Number(e.target.value))}
                                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                      placeholder="0"
                                   />
                                   <p className="text-xs text-gray-400 mt-1">{t.minWithdrawal} Rp 10.000</p>
                               </div>
                               <button 
                                  type="submit" 
                                  disabled={amount <= 0 || amount > availableBalanceRp} 
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
                               >
                                  {t.submitRequest}
                               </button>
                           </form>
                      </div>

                      {/* Right Side: History */}
                      <div className="border-l pl-0 md:pl-8 border-gray-100">
                          <h4 className="font-bold text-gray-800 mb-4">{t.history}</h4>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                              {myWithdrawals.length === 0 ? (
                                  <p className="text-gray-400 text-sm italic">{t.noWithdrawals}</p>
                              ) : (
                                  myWithdrawals.map(w => (
                                      <div key={w.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm">
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="font-bold text-gray-800">Rp {w.amount.toLocaleString()}</span>
                                             <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : w.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                 {w.status}
                                             </span>
                                         </div>
                                         <p className="text-xs text-gray-500">{new Date(w.requestDate).toLocaleDateString()}</p>
                                         
                                         {w.status === 'APPROVED' && (w.adminProofImage || w.adminProofLink) && (
                                             <div className="mt-2 pt-2 border-t border-gray-100">
                                                 <button 
                                                    onClick={() => setViewProof(w)}
                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                                 >
                                                     <Icons.Eye /> View Proof
                                                 </button>
                                             </div>
                                         )}
                                         {w.status === 'REJECTED' && w.rejectionReason && (
                                             <div className="mt-2 pt-2 border-t border-gray-100">
                                                 <button 
                                                    onClick={() => setViewProof(w)}
                                                    className="text-xs text-red-600 hover:underline flex items-center gap-1 font-bold"
                                                 >
                                                     <Icons.Info /> View Reason
                                                 </button>
                                             </div>
                                         )}
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Member Proof Viewer Modal */}
      {viewProof && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewProof(null)}>
                 <div className="bg-white rounded-xl p-6 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                     <button onClick={() => setViewProof(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><Icons.X /></button>
                     <h3 className="font-bold mb-4 text-gray-800 border-b pb-2">
                         {viewProof.status === 'APPROVED' ? 'Transfer Proof' : 'Rejection Details'}
                     </h3>
                     <div className="space-y-4">
                        {viewProof.status === 'REJECTED' && viewProof.rejectionReason && (
                            <div className="bg-red-50 p-3 rounded border border-red-100">
                                <p className="text-xs font-bold text-red-800 mb-1">Reason for Rejection:</p>
                                <p className="text-sm text-red-700">{viewProof.rejectionReason}</p>
                            </div>
                        )}

                        {viewProof.adminProofImage ? (
                            <div className="border rounded p-1">
                                <p className="text-xs text-gray-500 mb-1 px-1">Attached Image:</p>
                                <img src={viewProof.adminProofImage} className="w-full rounded" alt="Proof" />
                            </div>
                        ) : (
                            viewProof.status === 'APPROVED' && <p className="text-gray-500 text-sm italic">No proof image attached.</p>
                        )}
                        
                        {viewProof.adminProofLink && (
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-500 mb-1">Attached Link:</p>
                                <a href={viewProof.adminProofLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all font-medium">
                                    {viewProof.adminProofLink}
                                </a>
                            </div>
                        )}
                     </div>
                     <div className="mt-6 flex justify-end">
                         <button onClick={() => setViewProof(null)} className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-bold">Close</button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};

export default CommissionTable;
