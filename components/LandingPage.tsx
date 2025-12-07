
import React, { useState, useEffect } from 'react';
import { getSettings, getProducts, processGuestCheckout, getVouchers } from '../services/mockDatabase';
import { CartItem, Product } from '../types';
import { Icons } from '../constants';
import PaymentModal from './PaymentModal';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  referralCode?: string;
  cart: CartItem[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, d: number) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, referralCode }) => {
  const settings = getSettings();
  const products = getProducts();
  const vouchers = getVouchers();
  const [view, setView] = useState<'HOME' | 'CATALOG'>('HOME');
  
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  // New checkout fields
  const [checkoutReferral, setCheckoutReferral] = useState('');
  const [checkoutVoucherCode, setCheckoutVoucherCode] = useState('');
  const [checkoutAppliedVoucher, setCheckoutAppliedVoucher] = useState<{code: string, percent: number} | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'GATEWAY' | 'BANK_TRANSFER'>('GATEWAY');

  const appLogo = settings.branding.logo || settings.landingPage.logo;
  
  const heroAlign = settings.landingPage.heroAlignment || 'left';
  const textAlignClass = heroAlign === 'center' ? 'text-center items-center' : heroAlign === 'right' ? 'text-right items-end' : 'text-left items-start';
  const flexAlignClass = heroAlign === 'center' ? 'justify-center' : heroAlign === 'right' ? 'justify-end' : 'justify-start';

  // Auto-fill referral code when modal opens or referralCode prop changes
  useEffect(() => {
    if (referralCode) {
      setCheckoutReferral(referralCode);
    }
  }, [referralCode, checkoutProduct]);

  const handleOrderNow = (product: Product) => {
    setCheckoutProduct(product);
    setCheckoutVoucherCode('');
    setCheckoutAppliedVoucher(null);
  };

  const handleApplyGuestVoucher = () => {
      const v = vouchers.find(v => v.code === checkoutVoucherCode.toUpperCase() && v.isActive);
      if (v) {
          setCheckoutAppliedVoucher({ code: v.code, percent: v.discountPercent });
          alert(`Voucher Applied: ${v.discountPercent}% OFF`);
      } else {
          alert('Invalid or expired voucher code');
          setCheckoutAppliedVoucher(null);
      }
  };

  const handleOpenPayment = (e: React.FormEvent) => {
      e.preventDefault();
      setShowPaymentModal(true);
  };

  const handleProcessOrder = () => {
    if (!checkoutProduct) return;
    try {
        const user = processGuestCheckout(
            clientName, 
            clientEmail, 
            checkoutReferral || referralCode, 
            checkoutProduct, 
            paymentMethod,
            checkoutAppliedVoucher?.code
        );
        // Modal handles success UI
        localStorage.setItem('rda_session_user', JSON.stringify(user));
        // Redirect handled in PaymentModal via redirectUrl prop
    } catch (err: any) {
        alert('Error: ' + err.message);
    }
  };

  // Calculate pricing for checkout
  const originalPrice = checkoutProduct ? checkoutProduct.price : 0;
  const discountAmount = checkoutAppliedVoucher ? originalPrice * (checkoutAppliedVoucher.percent / 100) : 0;
  const finalPrice = originalPrice - discountAmount;

  const Navbar = () => (
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
             {appLogo ? (
                <img src={appLogo} alt="Logo" className="h-12 w-auto object-contain" />
             ) : (
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {settings.branding.appTitle.charAt(0)}
                </div>
             )}
             <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900 tracking-tight leading-none">{settings.branding.appTitle}</span>
                {settings.branding.appSubtitle && (
                    <span className="text-[11px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">{settings.branding.appSubtitle}</span>
                )}
             </div>
          </div>
          <div className="flex items-center gap-4">
             {referralCode && (
               <div className="hidden md:flex flex-col items-end mr-2">
                 <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Referral</span>
                 <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">{referralCode}</span>
               </div>
             )}
             
             {view === 'HOME' ? (
                <button onClick={() => setView('CATALOG')} className="text-sm font-bold text-gray-600 hover:text-blue-600 mr-2">Shop</button>
             ) : (
                <button onClick={() => setView('HOME')} className="text-sm font-bold text-gray-600 hover:text-blue-600 mr-2">Home</button>
             )}
             
             <button onClick={() => onNavigate('/login')} className="text-sm font-bold text-gray-900 hover:text-blue-600">Sign In</button>
             <button onClick={() => onNavigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/30">Join Now</button>
          </div>
        </div>
      </nav>
  );

  return (
    <div className="min-h-screen font-sans bg-gray-50 flex flex-col">
      <Navbar />

      {view === 'HOME' ? (
          <>
            <div className="relative bg-slate-900 text-white overflow-hidden flex-1 flex items-center min-h-[600px]">
                <div className="absolute inset-0 z-0">
                  <img src={settings.landingPage.backgroundImage} className="w-full h-full object-cover opacity-50 scale-105" alt="Background" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row">
                   <div className={`w-full max-w-3xl flex flex-col ${textAlignClass} ${heroAlign === 'center' ? 'mx-auto' : heroAlign === 'right' ? 'ml-auto' : ''}`}>
                       <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight" style={{ color: settings.landingPage.textColor }}>
                         {settings.landingPage.title}
                       </h1>
                       <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed max-w-2xl" style={{ color: settings.landingPage.textColor, opacity: 0.9 }}>
                         {settings.landingPage.description}
                       </p>
                       <div className={`flex gap-4 ${flexAlignClass}`}>
                           <button onClick={() => setView('CATALOG')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-emerald-500/20">Shop Products</button>
                           <button onClick={() => onNavigate('/register')} className="bg-white/10 hover:bg-white/20 backdrop-blur text-white border border-white/30 px-8 py-4 rounded-full font-bold text-lg transition-all">Become a Member</button>
                       </div>
                   </div>
                </div>
            </div>
            
            <div className="bg-white py-24">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">{settings.landingPage.features.title}</h2>
                    <p className="text-gray-500 text-lg max-w-3xl mx-auto leading-relaxed">{settings.landingPage.features.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {settings.landingPage.featureBoxes.map((box, idx) => {
                            const colors = [
                                { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600' },
                                { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600' },
                                { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600' }
                            ];
                            const style = colors[idx % colors.length];
                            return (
                                <div key={box.id} className={`p-8 rounded-2xl ${style.bg}`}>
                                    <div className={`w-16 h-16 ${style.icon} rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold`}>{idx + 1}</div>
                                    <h3 className="text-xl font-bold mb-3">{box.title}</h3>
                                    <p className="text-gray-600">{box.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {settings.landingPage.testimonials && settings.landingPage.testimonials.length > 0 && (
                <div className="bg-slate-50 py-24">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-12">Success Stories</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {settings.landingPage.testimonials.map(t => (
                                <div key={t.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-left">
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={t.image} className="w-14 h-14 rounded-full object-cover bg-gray-200" alt={t.name} />
                                        <div>
                                            <h4 className="font-bold text-gray-900">{t.name}</h4>
                                            <p className="text-sm text-blue-600 font-bold">{t.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 italic">"{t.content}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </>
      ) : (
          <div className="flex-1 bg-gray-50">
             <div className="bg-white border-b py-12">
                 <div className="max-w-7xl mx-auto px-4 text-center">
                     <h1 className="text-3xl font-bold text-gray-900 mb-2">{settings.productPage.title}</h1>
                     <p className="text-gray-500">{settings.productPage.subtitle}</p>
                 </div>
             </div>
             
             <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {products.map(product => (
                    <div key={product.id} className="group bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                      <div className="w-full aspect-square overflow-hidden relative bg-gray-100">
                        <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.name} />
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-3">{product.description}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                          <span className="text-2xl font-bold text-emerald-600">Rp {product.price.toLocaleString()}</span>
                          <button 
                            onClick={() => handleOrderNow(product)}
                            className="bg-gray-900 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-colors text-sm shadow-lg"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
      )}

      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
           <div className="md:col-span-2">
               <h4 className="text-xl font-bold mb-4">{settings.branding.appTitle}</h4>
               <p className="text-slate-400 text-sm max-w-sm">{settings.landingPage.footer?.aboutText}</p>
           </div>
           <div>
               <h4 className="text-lg font-bold mb-4">Quick Links</h4>
               <ul className="space-y-2 text-sm text-slate-400">
                   <li><button onClick={() => setView('HOME')} className="hover:text-white">Home</button></li>
                   <li><button onClick={() => setView('CATALOG')} className="hover:text-white">Shop</button></li>
                   <li><button onClick={() => onNavigate('/login')} className="hover:text-white">Login</button></li>
               </ul>
           </div>
           <div>
               <h4 className="text-lg font-bold mb-4">Contact</h4>
               <p className="text-slate-400 text-sm mb-1">{settings.landingPage.footer?.contactEmail}</p>
               <p className="text-slate-400 text-sm mb-4">{settings.landingPage.footer?.contactPhone}</p>
               
               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                   {settings.landingPage.footer.socialMedia?.facebook && (
                       <a href={settings.landingPage.footer.socialMedia.facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Icons.Facebook /></a>
                   )}
                   {settings.landingPage.footer.socialMedia?.instagram && (
                       <a href={settings.landingPage.footer.socialMedia.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Icons.Instagram /></a>
                   )}
                   {settings.landingPage.footer.socialMedia?.whatsapp && (
                       <a href={settings.landingPage.footer.socialMedia.whatsapp} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Icons.WhatsApp /></a>
                   )}
                   {settings.landingPage.footer.socialMedia?.tiktok && (
                       <a href={settings.landingPage.footer.socialMedia.tiktok} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Icons.TikTok /></a>
                   )}
                   {settings.landingPage.footer.socialMedia?.telegram && (
                       <a href={settings.landingPage.footer.socialMedia.telegram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Icons.Telegram /></a>
                   )}
                   {settings.landingPage.footer.socialMedia?.others?.map((link, idx) => (
                       <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold border px-2 rounded-full border-slate-600 hover:border-white">
                           {link.name}
                       </a>
                   ))}
               </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-600 text-sm mt-12 pt-8 border-t border-slate-800">
          &copy; {new Date().getFullYear()} {settings.branding.appTitle}. {settings.landingPage.footer?.copyrightText}
        </div>
      </footer>

      {checkoutProduct && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCheckoutProduct(null)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-fade-in-up">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="text-lg font-bold">Express Checkout</h3>
                    <button onClick={() => setCheckoutProduct(null)}><Icons.X /></button>
                </div>
                
                <form onSubmit={handleOpenPayment} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    <div className="bg-blue-50 p-4 rounded-xl flex gap-4 items-center border border-blue-100">
                        <img src={checkoutProduct.image} className="w-20 h-20 rounded-lg object-cover aspect-square bg-white" />
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{checkoutProduct.name}</p>
                            <div className="flex flex-col">
                                <span className="text-emerald-600 font-bold">Rp {originalPrice.toLocaleString()}</span>
                                {checkoutAppliedVoucher && (
                                    <span className="text-xs text-green-600">
                                        - {checkoutAppliedVoucher.percent}% (Rp {discountAmount.toLocaleString()})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                        <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter your full name" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                        <input required type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="We will send confirmation here" />
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                        <input required value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="08xxxxxxxx" />
                    </div>
                    
                    {/* Added Referral Code Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Referral Code</label>
                        <input 
                            value={checkoutReferral} 
                            onChange={e => setCheckoutReferral(e.target.value)} 
                            className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                            placeholder="Optional" 
                            readOnly={!!referralCode} // Make read-only if passed via URL prop
                        />
                        {referralCode && <p className="text-xs text-blue-500 mt-1">Auto-filled from referral link</p>}
                    </div>

                    {/* Added Voucher Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Voucher Code</label>
                        <div className="flex gap-2">
                             <input 
                                value={checkoutVoucherCode} 
                                onChange={e => setCheckoutVoucherCode(e.target.value.toUpperCase())} 
                                className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono" 
                                placeholder="PROMO CODE" 
                             />
                             <button type="button" onClick={handleApplyGuestVoucher} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-black">
                                 APPLY
                             </button>
                        </div>
                        {checkoutAppliedVoucher && <p className="text-xs text-green-600 mt-1 font-bold">Voucher Applied: {checkoutAppliedVoucher.percent}% OFF</p>}
                    </div>

                    {/* Payment Method Selection */}
                     <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Payment Method</label>
                        <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="w-full border p-2 rounded-lg">
                        <option value="GATEWAY">Payment Gateway (QRIS/VA)</option>
                        <option value="BANK_TRANSFER">Manual Bank Transfer</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center text-lg">
                             Pay Rp {finalPrice.toLocaleString()}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-3 flex justify-center items-center gap-1">
                            <Icons.Check /> Secure payment powered by Gateway
                        </p>
                    </div>
                </form>
            </div>
        </div>
      )}

      {showPaymentModal && checkoutProduct && (
          <PaymentModal 
             amount={finalPrice}
             paymentMethod={paymentMethod}
             onConfirm={handleProcessOrder}
             onCancel={() => setShowPaymentModal(false)}
             redirectUrl={checkoutProduct.customRedirectUrl}
          />
      )}
    </div>
  );
};

export default LandingPage;
