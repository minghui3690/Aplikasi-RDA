import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import TreeNode from './components/NetworkTree';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import MemberManagement from './components/MemberManagement';
import BusinessStats from './components/BusinessStats';
import MemberBusinessStats from './components/MemberBusinessStats';
import ProductManagement from './components/ProductManagement';
import Profile from './components/Profile';
import Withdrawal from './components/Withdrawal';
import CommissionTable from './components/CommissionTable';
import KakaView from './components/KakaView';
import KakaManagement from './components/KakaManagement';
import AdminSchedule from './components/Consultation/AdminSchedule';
import MemberConsultation from './components/Consultation/MemberConsultation';
import GuestBooking from './components/Consultation/GuestBooking';
import AdminWallet from './components/AdminWallet';
import RecentActions from './components/RecentActions';
import * as db from './services/mockDatabase';
import DashboardView from './components/DashboardView';
import AuthPage from './components/AuthPage';
import * as authService from './services/auth';
import { settingsApi } from './services/settingsService';
import { User, Product, CartItem, Announcement, UserRole } from './types';
import { Icons, TRANSLATIONS } from './constants';
import HumanDesignView from './components/HumanDesignView';
import NetworkComponents from './components/NetworkComponents';
import CustomerList from './components/CustomerList';
import MemberHumanDesignView from './components/MemberHumanDesignView';
import HDKnowledgeManager from './components/HDKnowledgeManager';
import TestimonialManager from './components/TestimonialManager';
import HDChatAssistant from './components/HDChatAssistant';

import ForgotModal from './components/ForgotModal';
import ResetPassword from './components/ResetPassword';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentLang, setCurrentLang] = useState('EN');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [networkTree, setNetworkTree] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [systemSettings, setSystemSettings] = useState(db.getSettings());
  
  const [referralCode, setReferralCode] = useState<string>('');
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authReferral, setAuthReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [editAnnounceId, setEditAnnounceId] = useState<string | null>(null);
  const [tempAnnounceData, setTempAnnounceData] = useState<Partial<Announcement>>({});
  
  const [networkView, setNetworkView] = useState<'TREE' | 'TABLE'>('TREE');
  const [networkDetails, setNetworkDetails] = useState<any[]>([]);
  const [networkSearch, setNetworkSearch] = useState('');

  const isSuperAdmin = currentUser?.role === UserRole.MASTER;
  const isManager = currentUser?.role === UserRole.ADMIN;
  const isAdminOrManager = isSuperAdmin || isManager;
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['EN'];

  const initAuth = async () => {
      const token = localStorage.getItem('rda_token');
      if (token) {
        try {
          const user = await authService.getMe();
          setCurrentUser(user);
        } catch (error) {
          localStorage.removeItem('rda_token');
        }
      }
      setIsLoadingAuth(false);
  };

  const refreshSettings = async () => {
      try {
          const s = await settingsApi.getSettings();
          setSystemSettings(s);
      } catch (e) { console.error('Failed to fetch settings', e); }
  };

  useEffect(() => {
    initAuth();
    refreshSettings();
    setProducts(db.getProducts());
  }, []);

  useEffect(() => {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('modal-open');

      const allFixed = document.querySelectorAll('div.fixed.inset-0');
      allFixed.forEach(el => {
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex);
          const isOverlay = (zIndex > 10 || style.zIndex === 'auto') && 
                           (style.backgroundColor.includes('rgba') || style.backgroundColor.includes('black') || style.backdropFilter !== 'none');
          
          if (isOverlay) {
              console.warn('Removing potentially stuck overlay:', el);
              el.remove();
          }
      });
  }, [location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const { user, token } = await authService.login(authEmail, authPassword);
      localStorage.setItem('rda_token', token);
      setCurrentUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const codeToUse = referralCode || authReferral;
      const { user, token } = await authService.register(authName, authEmail, authPassword, codeToUse);
      localStorage.setItem('rda_token', token);
      setCurrentUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rda_token');
    setCurrentUser(null);
    navigate('/');
    setCart([]);
  };

  const onNavigate = (path: string) => {
    if (path.startsWith('/')) navigate(path);
    else navigate('/' + path);
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

  useEffect(() => {
      const interval = setInterval(() => {
          const x = window.innerWidth / 2;
          const y = window.innerHeight / 2;
          const el = document.elementFromPoint(x, y);
          
          if (el) {
              const isBlocking = (el.tagName === 'DIV' && (el.className.includes('fixed') || el.className.includes('absolute') || el.className.includes('inset-0')));
              if (isBlocking) {
                  // console.error('⚠️ POTENTIAL BLOCKER:', el);
              }
          }
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  if (isLoadingAuth) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading RDA Bisnis...</p>
            </div>
        </div>
    );
  }

  return (
    <>
    <ForgotModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
    <Routes>
      <Route path="/" element={
        <LandingPage 
          onNavigate={onNavigate} 
          referralCode={referralCode}
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          updateCartQty={updateCartQty}
        />
      } />
      
      <Route path="/login" element={<AuthPage mode="login" systemSettings={systemSettings} referralCode={referralCode} setReferralCode={setReferralCode} setCurrentUser={setCurrentUser} setShowForgotModal={setShowForgotModal} />} />
      <Route path="/register" element={<AuthPage mode="register" systemSettings={systemSettings} referralCode={referralCode} setReferralCode={setReferralCode} setCurrentUser={setCurrentUser} setShowForgotModal={setShowForgotModal} />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/ref/:code" element={<WrapperRefHandler setCode={setReferralCode} />} />
      <Route path="/booking" element={<GuestBooking />} />
      
      {/* Protected Routes */}
      <Route path="/*" element={
        currentUser ? (
          <Layout user={currentUser} onLogout={handleLogout} currentPage={location.pathname.replace('/', '')} onNavigate={onNavigate} currentLang={currentLang} onLangChange={setCurrentLang}>
             <Routes>
                <Route path="/dashboard" element={
                     <DashboardView 
                        currentUser={currentUser} 
                        systemSettings={systemSettings} 
                        t={t} 
                        isAdmin={isAdminOrManager}
                        editAnnounceId={editAnnounceId}
                        setEditAnnounceId={setEditAnnounceId}
                        tempAnnounceData={tempAnnounceData}
                        setTempAnnounceData={setTempAnnounceData}
                        handleSaveAnnounce={() => { /* TODO: Implement API save */ }}
                        currentLang={currentLang}
                     />
                } />
                <Route path="/products" element={<ProductManagement user={currentUser} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateCartQty={updateCartQty} clearCart={() => setCart([])} onSuccess={() => {}} currentLang={currentLang} systemSettings={systemSettings} />} />
                <Route path="/purchases" element={<ProductManagement user={currentUser} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateCartQty={updateCartQty} clearCart={() => setCart([])} onSuccess={() => {}} viewMode="purchases" currentLang={currentLang} systemSettings={systemSettings} />} />
                <Route path="/network" element={<NetworkComponents currentUser={currentUser} systemSettings={systemSettings} t={t} />} />
                <Route path="/members" element={ isAdminOrManager ? <MemberManagement currentLang={currentLang} currentUser={currentUser} /> : <Navigate to="/dashboard" /> } />
                <Route path="/admin-wallet" element={isAdminOrManager ? <AdminWallet currentLang={currentLang} currentUser={currentUser} /> : <Navigate to="/dashboard" />} />
                <Route path="/stats" element={isAdminOrManager ? <BusinessStats /> : <Navigate to="/dashboard" />} />
                <Route path="/member-stats" element={!isAdminOrManager ? <MemberBusinessStats currentUser={currentUser} /> : <Navigate to="/dashboard" />} />
                <Route path="/commissions" element={!isAdminOrManager ? <CommissionTable user={currentUser} currentLang={currentLang} onNavigate={onNavigate} systemSettings={systemSettings} /> : <Navigate to="/dashboard" />} />
                <Route path="/settings" element={isSuperAdmin ? <Settings onUpdate={refreshSettings} /> : <Navigate to="/dashboard" />} />
                <Route path="/kaka-manager" element={isAdminOrManager ? <KakaManagement currentLang={currentLang} /> : <Navigate to="/dashboard" />} />
                <Route path="/customers" element={<CustomerList currentLang={currentLang} currentUser={currentUser} />} />
                <Route path="/kaka" element={!isAdminOrManager && currentUser?.isKakaUnlocked ? <KakaView currentLang={currentLang} currentUser={currentUser} /> : <Navigate to="/dashboard" />} />
                <Route path="/consultations" element={isAdminOrManager ? <AdminSchedule /> : <Navigate to="/dashboard" />} />
                <Route path="/reviews" element={isAdminOrManager ? <TestimonialManager /> : <Navigate to="/dashboard" />} />
                <Route path="/my-consultations" element={!isAdminOrManager ? <MemberConsultation /> : <Navigate to="/dashboard" />} />
                
                <Route path="/profile" element={<Profile user={currentUser} onUpdate={() => initAuth()} onNavigate={onNavigate} />} />
                <Route path="/admin/knowledge" element={isSuperAdmin ? <HDKnowledgeManager /> : <Navigate to="/dashboard" />} />
                <Route path="/ai-consultant" element={isAdminOrManager || (currentUser?.isAiAssistantUnlocked) ? <HDChatAssistant currentUser={currentUser || undefined} /> : <Navigate to="/dashboard" />} />
                <Route path="/human-design" element={<MemberHumanDesignView currentUser={currentUser} />} />
                <Route path="/wallet" element={<Withdrawal user={currentUser} onRefresh={() => {}} systemSettings={systemSettings} />} />
             </Routes>
          </Layout>
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
    </>
  );
};

const WrapperRefHandler = ({ setCode }: { setCode: (c: string) => void }) => {
    const params = useParams(); 
    const code = params.code;
    const navigate = useNavigate();
    useEffect(() => {
        if(code) { 
            setCode(code); 
            navigate('/');
        }
    }, [code, navigate, setCode]);
    return null;
}

export default App;