
import React, { useState } from 'react';
import { getKakaItems } from '../services/mockDatabase';
import { Icons, TRANSLATIONS } from '../constants';

interface Props {
  currentLang?: string;
}

const KakaView: React.FC<Props> = ({ currentLang = 'EN' }) => {
  const [items] = useState(getKakaItems());
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['EN'];

  const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  };

  const getMediaLabel = (type: string) => {
    switch(type) {
        case 'PHOTO': return { icon: <Icons.Camera />, label: t.photo };
        case 'LINK': return { icon: <Icons.Link />, label: t.link };
        case 'FILE': return { icon: <Icons.Document />, label: t.file };
        default: return { icon: <span>-</span>, label: '-' };
    }
  };

  const handleView = (url: string) => {
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <span className="text-blue-600"><Icons.Info /></span> {t.infoKaka}
           </h2>
           <p className="text-gray-500 mt-1">{t.kakaDesc}</p>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left">
               <thead>
                   <tr className="bg-white border-b border-gray-200 text-gray-800 text-xs uppercase tracking-wider">
                       <th className="px-6 py-4 font-bold">{t.no}</th>
                       <th className="px-6 py-4 font-bold">{t.date}</th>
                       <th className="px-6 py-4 font-bold">{t.description}</th>
                       <th className="px-6 py-4 font-bold">{t.media}</th>
                       <th className="px-6 py-4 font-bold text-center">{t.view}</th>
                       <th className="px-6 py-4 font-bold text-center">{t.download}</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                   {items.map((item, idx) => {
                       const media = getMediaLabel(item.mediaType);
                       return (
                           <tr key={item.id} className="hover:bg-gray-50">
                               <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                               <td className="px-6 py-4 text-sm font-medium">{formatDate(item.date)}</td>
                               <td className="px-6 py-4 text-sm text-gray-700">{item.description}</td>
                               <td className="px-6 py-4 text-sm">
                                   <div className="flex items-center gap-2 text-gray-600">
                                       {media.icon}
                                       <span className="font-medium">{media.label}</span>
                                   </div>
                               </td>
                               <td className="px-6 py-4 text-center">
                                   {item.mediaUrl ? (
                                       <button onClick={() => handleView(item.mediaUrl!)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors">
                                           <Icons.Eye />
                                       </button>
                                   ) : (
                                       <span className="text-gray-300">-</span>
                                   )}
                               </td>
                               <td className="px-6 py-4 text-center">
                                   {(item.mediaType === 'FILE' || item.mediaType === 'PHOTO') && item.mediaUrl ? (
                                       <a 
                                         href={item.mediaUrl} 
                                         download={item.mediaName || "download"} 
                                         className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors"
                                       >
                                           <Icons.Download />
                                       </a>
                                   ) : (
                                       <span className="text-gray-300">-</span>
                                   )}
                               </td>
                           </tr>
                       );
                   })}
                   {items.length === 0 && (
                       <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No Info available at the moment.</td></tr>
                   )}
               </tbody>
           </table>
       </div>
    </div>
  );
};

export default KakaView;
