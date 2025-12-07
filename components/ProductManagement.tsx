
import React, { useState } from 'react';
import { Product, User, UserRole, CartItem } from '../types';
import { getProducts, saveProducts, processMultiCartPurchase, getSettings, getVouchers, getTransactions } from '../services/mockDatabase';
import { Icons } from '../constants';
import VoucherManagement from './VoucherManagement';
import PaymentModal from './PaymentModal';
import KakaManagement from './KakaManagement';

interface Props {
  user: User;
  cart: CartItem[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, d: number) => void;
  clearCart: () => void;
  onSuccess: () => void;
  viewMode?: 'inventory' | 'shop' | 'purchases'; 
  currentLang?: string;
}

const ProductManagement: React.FC<Props> = ({ user, cart, addToCart, removeFromCart, updateCartQty, clearCart, onSuccess, viewMode = 'shop', currentLang = 'EN' }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const settings = getSettings();
  const vouchers = getVouchers();
  
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [view, setView] = useState<'grid' | 'cart'>('grid');
  
  // Admin Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});
  
  // Sub-Management State
  const [activeAdminTab, setActiveAdminTab] = useState<'PRODUCTS' | 'VOUCHERS' | 'KAKA'>('PRODUCTS');

  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'GATEWAY'>('GATEWAY');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{code: string, percent: number} | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Calcs
  const subtotal = cart.reduce((a,b) => a + (b.product.price * b.quantity), 0);
  const discount = appliedVoucher ? subtotal * (appliedVoucher.percent / 100) : 0;
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (settings.taxPercentage / 100);
  const totalWithTax = afterDiscount + tax;
  const pointValue = usePoints ? pointsAmount * settings.pointRate : 0;
  const grandTotal = Math.max(0, totalWithTax - pointValue);

  // My Purchases State
  const transactions = getTransactions().filter(t => t.userId === user.id);
  const myPurchasedProducts = transactions.flatMap(t => t.items.map(i => i.product)).filter((v,i,a) => a.findIndex(t => t.id === v.id) === i);

  // Determine redirect URL from cart items (priority to first item with custom URL)
  const cartRedirectUrl = cart.find(item => item.product.customRedirectUrl)?.product.customRedirectUrl;

  const handleApplyVoucher = () => {
      const v = vouchers.find(v => v.code === voucherCode && v.isActive);
      if (v) {
          setAppliedVoucher({ code: v.code, percent: v.discountPercent });
          alert(`Voucher Applied: ${v.discountPercent}% OFF`);
      } else {
          alert('Invalid or expired voucher code');
          setAppliedVoucher(null);
      }
  };

  const handlePriceChange = (val: number) => {
      const points = val / settings.pointRate;
      setEditProduct({ ...editProduct, price: val, points: points });
  };

  const handleSaveProduct = () => {
    let newProducts = [...products];
    if (editProduct.id) {
       newProducts = newProducts.map(p => p.id === editProduct.id ? { ...p, ...editProduct } as Product : p);
    } else {
       newProducts.push({
         ...editProduct,
         id: 'p' + Date.now(),
         image: editProduct.image || 'https://placehold.co/1024x1024'
       } as Product);
    }
    saveProducts(newProducts);
    setProducts(newProducts);
    setIsEditing(false);
    setEditProduct({});
  };

  const handleDelete = (id: string) => {
    const newProducts = products.filter(p => p.id !== id);
    saveProducts(newProducts);
    setProducts(newProducts);
  };

  const confirmCheckout = (proof?: string) => {
    try {
      if (usePoints && pointsAmount > user.walletBalance) {
          alert('Insufficient points');
          return;
      }
      processMultiCartPurchase(
          user.id, 
          cart, 
          paymentMethod, 
          appliedVoucher?.code,
          usePoints ? pointsAmount : 0,
          proof
      );
      clearCart();
      setAppliedVoucher(null);
      setUsePoints(false);
      setPointsAmount(0);
      setShowPaymentModal(false);
      // alert('Purchase Successful!'); // Modal handles UI
      onSuccess();
      setView('grid');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const reader = new FileReader();
       reader.onload = (x) => {
          setEditProduct({ ...editProduct, image: x.target?.result as string });
       };
       reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- RENDER VIEWS ---

  // 1. ADMIN INVENTORY VIEW
  if (isAdmin) {
    if (activeAdminTab === 'VOUCHERS') {
       return (
         <div className="space-y-6">
            <button onClick={() => setActiveAdminTab('PRODUCTS')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium mb-4">
                <span className="text-lg">←</span> Back to Products
            </button>
            <VoucherManagement />
         </div>
       );
    }
    if (activeAdminTab === 'KAKA') {
        return (
            <div className="space-y-6">
                <button onClick={() => setActiveAdminTab('PRODUCTS')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium mb-4">
                    <span className="text-lg">←</span> Back to Products
                </button>
                <KakaManagement currentLang={currentLang} />
            </div>
        );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <h2 className="text-2xl font-bold text-gray-800">Product Inventory</h2>
           <div className="flex gap-2">
               <button onClick={() => setActiveAdminTab('KAKA')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-purple-700 transition-colors flex items-center gap-2">
                 <Icons.Info /> KAKA
               </button>
               <button onClick={() => setActiveAdminTab('VOUCHERS')} className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-slate-800 transition-colors flex items-center gap-2">
                 <Icons.Ticket /> +Voucher
               </button>
               <button onClick={() => { setEditProduct({}); setIsEditing(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors">
                 + Add Product
               </button>
           </div>
        </div>

        {isEditing && (
          <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-lg">
             <h3 className="font-bold mb-4">{editProduct.id ? 'Edit Product' : 'New Product'}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input placeholder="Product Name" className="border p-2 rounded" value={editProduct.name || ''} onChange={e => setEditProduct({...editProduct, name: e.target.value})} />
               <div>
                   <label className="text-xs text-gray-500">Price (Rp)</label>
                   <input type="number" className="border p-2 rounded w-full" value={editProduct.price || ''} onChange={e => handlePriceChange(Number(e.target.value))} />
               </div>
               <div>
                   <label className="text-xs text-gray-500">Points (Auto-calculated)</label>
                   <input type="number" className="border p-2 rounded w-full bg-gray-50" value={editProduct.points || ''} readOnly />
               </div>
               <div>
                 <label className="block text-xs text-gray-500 mb-1 font-bold">Image Size (Recommended: 1024x1024px or 400x400px)</label>
                 <div className="flex items-center gap-2">
                    <input type="file" onChange={handleImageUpload} className="text-sm" accept="image/*" />
                    {editProduct.image && <img src={editProduct.image} className="h-10 w-10 object-cover rounded aspect-square" />}
                 </div>
               </div>
               <div className="md:col-span-2">
                 <label className="block text-xs text-gray-500 mb-1">Digital Product Link (PDF)</label>
                 <input placeholder="https://..." className="border p-2 rounded w-full" value={editProduct.pdfUrl || ''} onChange={e => setEditProduct({...editProduct, pdfUrl: e.target.value})} />
               </div>
               {/* NEW FIELD: REDIRECT URL */}
               <div className="md:col-span-2">
                 <label className="block text-xs text-gray-500 mb-1">Redirect URL (After Payment)</label>
                 <input placeholder="https://richdragon.id/..." className="border p-2 rounded w-full" value={editProduct.customRedirectUrl || ''} onChange={e => setEditProduct({...editProduct, customRedirectUrl: e.target.value})} />
                 <p className="text-[10px] text-gray-400 mt-1">Leave empty to use default (https://richdragon.id/richhd)</p>
               </div>
               <textarea placeholder="Description" className="border p-2 rounded md:col-span-2" value={editProduct.description || ''} onChange={e => setEditProduct({...editProduct, description: e.target.value})} />
             </div>
             <div className="mt-4 flex gap-2 justify-end">
               <button onClick={() => setIsEditing(false)} className="text-gray-500 px-4 py-2">Cancel</button>
               <button onClick={handleSaveProduct} className="bg-emerald-600 text-white px-6 py-2 rounded font-bold">Save</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center">
              <img src={p.image} className="w-20 h-20 object-cover rounded-lg bg-gray-100 aspect-square" />
              <div className="flex-1 min-w-0">
                 <h4 className="font-bold truncate">{p.name}</h4>
                 <p className="text-sm text-gray-500">Rp {p.price.toLocaleString(undefined, {minimumFractionDigits:2})} • {p.points} Pts</p>
                 {p.pdfUrl && <span className="text-xs text-blue-500 flex items-center gap-1 mt-1"><Icons.Document /> Digital Product</span>}
                 {p.customRedirectUrl && <span className="text-xs text-orange-500 flex items-center gap-1 mt-1"><Icons.Link /> Custom Redirect</span>}
                 <div className="mt-3 flex gap-2">
                   <button onClick={() => { setEditProduct(p); setIsEditing(true); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100">Edit</button>
                   <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded border border-red-100">Delete</button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. MEMBER PURCHASES VIEW
  if (viewMode === 'purchases') {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">My Purchased Products</h2>
            {myPurchasedProducts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
                    <p className="text-gray-500 mb-4">You haven't purchased any products yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myPurchasedProducts.map((p, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 flex items-center gap-6 shadow-sm">
                            <img src={p.image} className="w-24 h-24 object-cover rounded-lg bg-gray-100 aspect-square" />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">{p.description}</p>
                                {p.pdfUrl ? (
                                    <div className="flex gap-2">
                                        <a 
                                            href={p.pdfUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            <Icons.Eye /> View
                                        </a>
                                        <a 
                                            href={p.pdfUrl} 
                                            download={p.name + ".pdf"} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            <Icons.Document /> Download
                                        </a>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">No downloadable content</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  }

  // 3. MEMBER SHOP VIEW
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-20 z-10">
         <h2 className="text-xl font-bold text-gray-800">Shop Products</h2>
         <div className="flex gap-4">
            <button onClick={() => setView('grid')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Browse</button>
            <button onClick={() => setView('cart')} className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${view === 'cart' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Icons.Cart /> Cart ({cart.reduce((a,b) => a + b.quantity, 0)})
            </button>
         </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className="w-full aspect-square overflow-hidden relative group bg-gray-100">
                <img src={product.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
                <p className="text-gray-500 text-sm h-10 mb-4 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-emerald-600">Rp {product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  <button onClick={() => { addToCart(product); }} className="bg-slate-900 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">+ Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-4">
             {cart.length === 0 ? <p className="text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-100">Cart is empty</p> : cart.map(item => (
               <div key={item.product.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                  <img src={item.product.image} className="w-20 h-20 rounded bg-gray-100 object-cover aspect-square" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{item.product.name}</h4>
                    <p className="text-sm text-gray-500">Rp {item.product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button onClick={() => updateCartQty(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-100 font-bold">-</button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-100 font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 p-2"><Icons.X /></button>
               </div>
             ))}

             {cart.length > 0 && (
                 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                     <div>
                         <label className="block text-sm font-medium mb-1">Voucher Code</label>
                         <div className="flex gap-2">
                             <input className="border p-2 rounded flex-1 uppercase font-mono" value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" />
                             <button onClick={handleApplyVoucher} className="bg-gray-800 text-white px-4 py-2 rounded font-bold text-xs">APPLY</button>
                         </div>
                         {appliedVoucher && <p className="text-xs text-green-600 mt-1">Voucher applied: {appliedVoucher.percent}% Discount</p>}
                     </div>
                     <div className="pt-2 border-t">
                         <div className="flex items-center gap-2 mb-2">
                             <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} className="h-4 w-4" />
                             <label className="text-sm font-medium">Pay with Points</label>
                         </div>
                         {usePoints && (
                             <div>
                                 <p className="text-xs text-gray-500 mb-1">Available: {user.walletBalance.toLocaleString()} Pts</p>
                                 <input type="number" className="border p-2 rounded w-full" value={pointsAmount} max={user.walletBalance} onChange={e => setPointsAmount(Number(e.target.value))} placeholder="Points to use" />
                                 <p className="text-xs text-blue-600 mt-1">Equals: Rp {(pointsAmount * settings.pointRate).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                             </div>
                         )}
                     </div>
                 </div>
             )}
           </div>
           
           <div className="bg-white p-6 rounded-xl border border-gray-100 h-fit shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Order Summary</h3>
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold">Rp {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                {appliedVoucher && <div className="flex justify-between text-green-600"><span>Discount ({appliedVoucher.percent}%)</span><span>- Rp {discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">PPn / Tax ({settings.taxPercentage}%)</span><span className="font-bold">Rp {tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                {usePoints && <div className="flex justify-between text-blue-600"><span>Points Payment</span><span>- Rp {pointValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>}
                <div className="pt-3 border-t flex justify-between text-lg font-bold text-gray-900"><span>Grand Total</span><span>Rp {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
              </div>

              <div className="mb-6">
                 <label className="block text-sm font-medium mb-2">Payment Method</label>
                 <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="w-full border p-2 rounded-lg">
                   <option value="GATEWAY">Payment Gateway (QRIS/VA)</option>
                   <option value="BANK_TRANSFER">Manual Bank Transfer</option>
                 </select>
              </div>

              <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50">Pay Now</button>
           </div>
        </div>
      )}
      
      {showPaymentModal && (
          <PaymentModal 
             amount={grandTotal}
             paymentMethod={paymentMethod}
             onConfirm={confirmCheckout}
             onCancel={() => setShowPaymentModal(false)}
             redirectUrl={cartRedirectUrl}
          />
      )}
    </div>
  );
};

export default ProductManagement;
