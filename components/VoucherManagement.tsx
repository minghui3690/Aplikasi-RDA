
import React, { useState } from 'react';
import { getVouchers, saveVouchers } from '../services/mockDatabase';
import { Voucher } from '../types';
import { Icons } from '../constants';

const VoucherManagement: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(getVouchers());
  const [isEditing, setIsEditing] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Partial<Voucher>>({});

  const handleSave = () => {
      let newVouchers = [...vouchers];
      if (editVoucher.id) {
          newVouchers = newVouchers.map(v => v.id === editVoucher.id ? { ...v, ...editVoucher } as Voucher : v);
      } else {
          newVouchers.push({
              ...editVoucher,
              id: 'v' + Date.now(),
              isActive: true
          } as Voucher);
      }
      saveVouchers(newVouchers);
      setVouchers(newVouchers);
      setIsEditing(false);
      setEditVoucher({});
  };

  const handleDelete = (id: string) => {
      if (confirm('Delete this voucher?')) {
          const newVouchers = vouchers.filter(v => v.id !== id);
          saveVouchers(newVouchers);
          setVouchers(newVouchers);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
           <h2 className="text-2xl font-bold text-gray-800">Discount Vouchers</h2>
           <button onClick={() => { setEditVoucher({}); setIsEditing(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors">
             + New Voucher
           </button>
       </div>

       {isEditing && (
           <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-lg mb-6">
               <h3 className="font-bold mb-4">{editVoucher.id ? 'Edit Voucher' : 'Create Voucher'}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <label className="text-xs text-gray-500">Voucher Code</label>
                       <input className="border p-2 rounded w-full font-mono uppercase" value={editVoucher.code || ''} onChange={e => setEditVoucher({...editVoucher, code: e.target.value.toUpperCase()})} />
                   </div>
                   <div>
                       <label className="text-xs text-gray-500">Discount (%)</label>
                       <input type="number" className="border p-2 rounded w-full" value={editVoucher.discountPercent || ''} onChange={e => setEditVoucher({...editVoucher, discountPercent: Number(e.target.value)})} />
                   </div>
                   <div>
                       <label className="text-xs text-gray-500">Start Date</label>
                       <input type="date" className="border p-2 rounded w-full" value={editVoucher.startDate || ''} onChange={e => setEditVoucher({...editVoucher, startDate: e.target.value})} />
                   </div>
                   <div>
                       <label className="text-xs text-gray-500">End Date</label>
                       <input type="date" className="border p-2 rounded w-full" value={editVoucher.endDate || ''} onChange={e => setEditVoucher({...editVoucher, endDate: e.target.value})} />
                   </div>
                   <div className="md:col-span-2 flex items-center gap-2">
                       <input type="checkbox" checked={editVoucher.isActive ?? true} onChange={e => setEditVoucher({...editVoucher, isActive: e.target.checked})} />
                       <span className="text-sm">Active</span>
                   </div>
               </div>
               <div className="mt-4 flex gap-2 justify-end">
                   <button onClick={() => setIsEditing(false)} className="text-gray-500 px-4 py-2">Cancel</button>
                   <button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded font-bold">Save</button>
               </div>
           </div>
       )}

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left">
               <thead>
                   <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                       <th className="px-6 py-3">Code</th>
                       <th className="px-6 py-3">Discount</th>
                       <th className="px-6 py-3">Validity</th>
                       <th className="px-6 py-3">Status</th>
                       <th className="px-6 py-3">Action</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                   {vouchers.map(v => (
                       <tr key={v.id}>
                           <td className="px-6 py-4 font-mono font-bold text-blue-600">{v.code}</td>
                           <td className="px-6 py-4 font-bold">{v.discountPercent}%</td>
                           <td className="px-6 py-4 text-sm text-gray-500">{v.startDate} to {v.endDate}</td>
                           <td className="px-6 py-4">
                               <span className={`text-xs px-2 py-1 rounded ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {v.isActive ? 'Active' : 'Inactive'}
                               </span>
                           </td>
                           <td className="px-6 py-4 flex gap-2">
                               <button onClick={() => { setEditVoucher(v); setIsEditing(true); }} className="text-blue-600 text-xs font-bold hover:underline">Edit</button>
                               <button onClick={() => handleDelete(v.id)} className="text-red-600 text-xs font-bold hover:underline">Delete</button>
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
    </div>
  );
};

export default VoucherManagement;
