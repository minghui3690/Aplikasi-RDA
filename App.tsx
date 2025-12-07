import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TreeNode from './components/NetworkTree';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import MemberManagement from './components/MemberManagement';
import BusinessStats from './components/BusinessStats';
import ProductManagement from './components/ProductManagement';
import Profile from './components/Profile';
import Withdrawal from './components/Withdrawal';
import CommissionTable from './components/CommissionTable';
import KakaView from './components/KakaView';
import RecentActions from './components/RecentActions';
import * as db from './services/mockDatabase';
import { User, Product, Transaction, UserRole, CartItem, Announcement } from './types';
import { Icons, TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/'); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentLang, setCurrentLang] = useState('EN');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [networkTree, setNetworkTree] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [systemSettings, setSystemSettings] = useState(db.getSettings());
  
  const [referralCode, setReferralCode] = useState<string>('');

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authReferral, setAuthReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [editAnnounceId, setEditAnnounceId] = useState<string | null>(null);
  const [tempAnnounceData, setTempAnnounceData] = useState<Partial<Announcement>>({});

  // Network Page State
  const [networkView, setNetworkView] = useState<'TREE' | 'TABLE'>('TREE');
  const [networkDetails, setNetworkDetails] = useState<any[]>([]);
  const [networkSearch, setNetworkSearch] = useState('');

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['EN'];

  useEffect(() => {
    db.seedData(); // Ensure this runs to fix admin credentials
    const storedUser = localStorage.getItem('rda_session_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const dbUsers = db.getUsers();
        // Check if user still exists (might have been reset)
        const validUser = dbUsers.find(u => u.id === parsedUser.id);
        if (validUser) {
            setCurrentUser(validUser);
        } else {
            localStorage.removeItem('rda_session_user');
            setCurrentUser(null);
        }
      } catch {
        localStorage.removeItem('rda_session_user');
        setCurrentUser(null);
      }
    }
    setProducts(db.getProducts());
    setSystemSettings(db.getSettings());
    
    if (currentPath.startsWith('/ref/')) {
       const code = currentPath.split('/')[2];
       if (code && code !== referralCode) setReferralCode(code);
    }
  }, []);

  const refreshData = () => {
    setProducts(db.getProducts());
    setSystemSettings(db.getSettings());
    if (currentUser) {
      const freshUser = db.getUsers().find(u => u.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem('rda_session_user', JSON.stringify(freshUser));
        setNetworkTree(db.getMemberTree(freshUser.id));
        setNetworkDetails(db.getDownlineDetails(freshUser.id));
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentPath]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const user = db.loginUser(authEmail, authPassword);
      setCurrentUser(user);
      localStorage.setItem('rda_session_user', JSON.stringify(user));
      setCurrentPath('/dashboard');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const codeToUse = referralCode || authReferral;
      const user = db.registerUser(authName, authEmail, authPassword, codeToUse);
      setCurrentUser(user);
      localStorage.setItem('rda_session_user', JSON.stringify(user));
      setCurrentPath('/dashboard');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rda_session_user');
    setCurrentUser(null);
    setCurrentPath('/');
    setCart([]);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Password reset link has been sent to ${forgotEmail}`);
      setShowForgotModal(false);
      setForgotEmail('');
  };

  const handleEditAnnounce = (ann: Announcement) => {
      setEditAnnounceId(ann.id);
      setTempAnnounceData(ann);
  };

  const handleSaveAnnounce = () => {
      const newAnnouncements = systemSettings.announcements.map(a => 
          a.id === editAnnounceId ? { ...a, ...tempAnnounceData } as Announcement : a
      );
      const newSettings = { ...systemSettings, announcements: newAnnouncements };
      db.saveSettings(newSettings);
      setSystemSettings(newSettings);
      setEditAnnounceId(null);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exist = prev.find(item => item.product.id === product.id);
      if (exist) return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product, quantity: 1 }];
    });
  };
  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.product.id !== productId));
  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  if (currentPath === '/' || currentPath.startsWith('/ref/')) {
    return (
      <LandingPage 
        onNavigate={setCurrentPath} 
        referralCode={referralCode}
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        updateCartQty={updateCartQty}
      />
    );
  }

  if (currentPath === '/login' || currentPath === '/register') {
      const isLogin = currentPath === '/login';
      return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans relative">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          <div className="bg-slate-900 p-8 text-center relative">
            {systemSettings.branding.logo && <img src={systemSettings.branding.logo} className="h-12 w-auto mx-auto mb-2" />}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
               {systemSettings.branding.appTitle}
            </h1>
            <p className="text-slate-400">{systemSettings.branding.appSubtitle}</p>
          </div>
          <div className="p-8">
            <div className="flex mb-6 border-b border-gray-100">
              <button className={`flex-1 pb-3 font-semibold text-sm transition-colors ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => setCurrentPath('/login')}>Sign In</button>
              <button className={`flex-1 pb-3 font-semibold text-sm transition-colors ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => setCurrentPath('/register')}>Register</button>
            </div>
            {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{authError}</div>}
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {!isLogin && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={authName} onChange={e => setAuthName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative"><input type={showPassword ? "text" : "password"} required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">{showPassword ? <Icons.EyeOff /> : <Icons.Eye />}</button></div>
              </div>
              
              {isLogin && (
                  <div className="flex justify-between items-center text-sm mt-2">
                      <label className="flex items-center text-gray-600 cursor-pointer">
                          <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          Remember me
                      </label>
                      <button type="button" onClick={() => setShowForgotModal(true)} className="text-blue-600 hover:text-blue-500 font-medium">
                          Forgot Password?
                      </button>
                  </div>
              )}

              {!isLogin && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label><input type="text" value={referralCode || authReferral} onChange={e => { setAuthReferral(e.target.value); setReferralCode(''); }} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" placeholder="Optional (Admin default)" /></div>
              )}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-2">{isLogin ? 'Login to Account' : 'Create Account'}</button>
            </form>
            
            <div className="mt-6 text-center border-t border-gray-100 pt-4">
                <button onClick={() => setCurrentPath('/')} className="text-sm text-gray-500 hover:text-blue-600 font-medium flex items-center justify-center gap-2 mx-auto">
                    <span>←</span> Back to Home
                </button>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-fade-in-up">
                    <button onClick={() => setShowForgotModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><Icons.X /></button>
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                            <Icons.User />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                        <p className="text-sm text-gray-500">Enter your email to receive reset instructions.</p>
                    </div>
                    <form onSubmit={handleForgotSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                required 
                                value={forgotEmail} 
                                onChange={e => setForgotEmail(e.target.value)} 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="name@example.com"
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                            Send Reset Link
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (!currentUser) return null;

  const transactions = db.getTransactions();
  const memberTransactions = isAdmin ? [] : transactions.filter(t => t.userId === currentUser.id);

  const totalPoints = currentUser.walletBalance;
  const withdrawalBalance = totalPoints * systemSettings.pointRate;
  const lifetimeEarnings = currentUser.totalEarnings;
  const totalSalesVolume = isAdmin ? transactions.reduce((acc, t) => acc + t.totalAmount, 0) : memberTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

  const theme = systemSettings.branding.theme;

  const filteredNetworkDetails = networkDetails.filter(item => 
      item.name.toLowerCase().includes(networkSearch.toLowerCase()) || 
      item.email.toLowerCase().includes(networkSearch.toLowerCase())
  );

  return (
    <Layout user={currentUser} onLogout={handleLogout} currentPage={currentPath.replace('/', '')} onNavigate={(p) => setCurrentPath('/' + p)} currentLang={currentLang} onLangChange={setCurrentLang}>
      
      {currentPath === '/dashboard' && (
         <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between" style={{ backgroundColor: theme.cardBackground, color: theme.cardText }}>
                      <div className="flex items-center gap-2">
                          <p className="text-sm uppercase font-bold tracking-wide opacity-70">{t.totalPoints}</p>
                          <span className="text-[10px] opacity-60">({t.pointRateInfo} {systemSettings.pointRate})</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{totalPoints.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between" style={{ backgroundColor: theme.cardBackground, color: theme.cardText }}>
                      <p className="text-sm uppercase font-bold tracking-wide opacity-70">{t.withdrawalBal}</p>
                      <p className="text-2xl font-bold mt-2">Rp {withdrawalBalance.toLocaleString('id-ID', {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between" style={{ backgroundColor: theme.cardBackground, color: theme.cardText }}>
                      <p className="text-sm uppercase font-bold tracking-wide opacity-70">{t.lifetimeEarn}</p>
                      <p className="text-2xl font-bold mt-2">{lifetimeEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between" style={{ backgroundColor: theme.cardBackground, color: theme.cardText }}>
                      <p className="text-sm uppercase font-bold tracking-wide opacity-70">{t.totalSales}</p>
                      <p className="text-2xl font-bold mt-2">Rp {totalSalesVolume.toLocaleString('id-ID', {minimumFractionDigits: 2})}</p>
                  </div>
             </div>

             <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Icons.Dashboard /> {t.news}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {systemSettings.announcements.map((ann) => (
                        <div key={ann.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            {editAnnounceId === ann.id ? (
                                <div className="p-4 flex-1 flex flex-col space-y-3 bg-yellow-50">
                                    <input className="border p-2 rounded" value={tempAnnounceData.title} onChange={e => setTempAnnounceData({...tempAnnounceData, title: e.target.value})} />
                                    <input type="date" className="border p-2 rounded" value={tempAnnounceData.date ? new Date(tempAnnounceData.date).toISOString().split('T')[0] : ''} onChange={e => setTempAnnounceData({...tempAnnounceData, date: e.target.value})} />
                                    <textarea className="border p-2 rounded flex-1" value={tempAnnounceData.content} onChange={e => setTempAnnounceData({...tempAnnounceData, content: e.target.value})} />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveAnnounce} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">Save</button>
                                        <button onClick={() => setEditAnnounceId(null)} className="text-gray-500 text-sm">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg">{ann.title}</h4>
                                            <p className="text-xs text-slate-300 mt-1">{new Date(ann.date).toLocaleDateString()}</p>
                                        </div>
                                        {isAdmin && <button onClick={() => handleEditAnnounce(ann)} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Edit</button>}
                                    </div>
                                    <div className="p-6 bg-white flex-1">
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{ann.content}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
             </div>

             <RecentActions user={currentUser} currentLang={currentLang} />
             
             {!isAdmin && (
                 <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col items-center justify-center">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Connect With Admin</p>
                     <div className="flex flex-wrap justify-center gap-4">
                        {systemSettings.landingPage.footer.socialMedia.facebook && (
                            <a href={systemSettings.landingPage.footer.socialMedia.facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Icons.Facebook /></a>
                        )}
                        {systemSettings.landingPage.footer.socialMedia.instagram && (
                            <a href={systemSettings.landingPage.footer.socialMedia.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors"><Icons.Instagram /></a>
                        )}
                        {systemSettings.landingPage.footer.socialMedia.whatsapp && (
                            <a href={systemSettings.landingPage.footer.socialMedia.whatsapp} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-600 transition-colors"><Icons.WhatsApp /></a>
                        )}
                        {systemSettings.landingPage.footer.socialMedia.tiktok && (
                            <a href={systemSettings.landingPage.footer.socialMedia.tiktok} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-black transition-colors"><Icons.TikTok /></a>
                        )}
                        {systemSettings.landingPage.footer.socialMedia.telegram && (
                            <a href={systemSettings.landingPage.footer.socialMedia.telegram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors"><Icons.Telegram /></a>
                        )}
                        {systemSettings.landingPage.footer.socialMedia.others?.map((link, idx) => (
                             <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-xs font-bold border border-gray-300 px-3 py-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                                 {link.name}
                             </a>
                        ))}
                     </div>
                 </div>
             )}
         </div>
      )}

      {currentPath === '/products' && <ProductManagement user={currentUser} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateCartQty={updateCartQty} clearCart={() => setCart([])} onSuccess={refreshData} currentLang={currentLang} />}
      
      {currentPath === '/network' && (isAdmin ? <MemberManagement currentLang={currentLang} /> : (
          <div className="bg-white p-6 rounded-xl shadow-sm overflow-auto">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <h3 className="font-bold text-lg">{t.myNet}</h3>
                  <div className="flex gap-2 w-full md:w-auto">
                      <div className="relative flex-1">
                         <span className="absolute left-3 top-2.5 text-gray-400 text-xs"><Icons.Search /></span>
                         <input 
                            type="text" 
                            value={networkSearch}
                            onChange={e => setNetworkSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-full outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={t.searchMember}
                         />
                      </div>
                      <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-bold shrink-0">
                          <button 
                            onClick={() => setNetworkView('TREE')}
                            className={`px-3 py-1.5 rounded-md ${networkView === 'TREE' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Tree
                          </button>
                          <button 
                            onClick={() => setNetworkView('TABLE')}
                            className={`px-3 py-1.5 rounded-md ${networkView === 'TABLE' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Table
                          </button>
                      </div>
                  </div>
              </div>
              
              {networkView === 'TREE' ? (
                  networkTree && <TreeNode node={networkTree} level={0} maxDepth={systemSettings.commissionLevels} />
              ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                  <th className="px-4 py-3">{t.level}</th>
                                  <th className="px-4 py-3">{t.memberInfo}</th>
                                  <th className="px-4 py-3">{t.status}</th>
                                  <th className="px-4 py-3 text-right">Total Purchase</th>
                                  <th className="px-4 py-3">Products Bought</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredNetworkDetails.map((item: any) => (
                                  <tr key={item.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">Lvl {item.level}</span></td>
                                      <td className="px-4 py-3">
                                          <p className="font-bold text-sm text-gray-900">{item.name}</p>
                                          <p className="text-xs text-gray-500">{item.email}</p>
                                      </td>
                                      <td className="px-4 py-3"><span className={`text-xs ${item.isActive ? 'text-green-600' : 'text-red-600'} font-bold`}>{item.isActive ? t.active : t.inactive}</span></td>
                                      <td className="px-4 py-3 text-right font-medium text-gray-700">Rp {item.totalSales.toLocaleString()}</td>
                                      <td className="px-4 py-3 text-xs text-gray-500">{item.products || '-'}</td>
                                  </tr>
                              ))}
                              {filteredNetworkDetails.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">No downlines found matching search.</td></tr>}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      ))}
      {currentPath === '/purchases' && <ProductManagement user={currentUser} cart={[]} addToCart={() => {}} removeFromCart={() => {}} updateCartQty={() => {}} clearCart={() => {}} onSuccess={() => {}} viewMode="purchases" />}
      {currentPath === '/wallet' && <Withdrawal user={currentUser} onRefresh={refreshData} />}
      {currentPath === '/settings' && isAdmin && <Settings />}
      {currentPath === '/profile' && <Profile user={currentUser} onUpdate={() => { refreshData(); }} onNavigate={(p) => setCurrentPath(p)} />}
      {currentPath === '/members' && isAdmin && <MemberManagement currentLang={currentLang} />}
      {currentPath === '/stats' && isAdmin && <BusinessStats />}
      {currentPath === '/commissions' && !isAdmin && <CommissionTable user={currentUser} currentLang={currentLang} onNavigate={(p) => setCurrentPath('/' + p)} />}
      {currentPath === '/kaka' && <KakaView currentLang={currentLang} />}

    </Layout>
  );
};

export default App;