import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/auth';
import * as db from '../services/mockDatabase';
import { SystemSettings, User } from '../types';
import { Icons } from '../constants';
import kamikitaLogo from '../assets/kamikita_logo.jpg';

interface AuthPageProps {
  mode: 'login' | 'register';
  systemSettings: SystemSettings;
  referralCode: string;
  setReferralCode: (code: string) => void;
  setCurrentUser: (user: User | null) => void;
  setShowForgotModal: (show: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({
  mode, systemSettings, referralCode, setReferralCode, setCurrentUser, setShowForgotModal
}) => {
  const navigate = useNavigate();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authReferral, setAuthReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // SAFETY: Force clear any stuck modals from previous session
  React.useEffect(() => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
      document.body.classList.remove('modal-open');
      
      // Remove any stuck high-z-index overlays
      const stuckOverlays = document.querySelectorAll('.fixed.inset-0.z-50');
      stuckOverlays.forEach(el => {
          if (el.innerHTML.includes('Consultation') || el.innerHTML.includes('Details')) {
             el.remove();
          }
      });
  }, []);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans relative">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
        <div className="bg-black p-6 text-center relative flex items-center justify-center min-h-[160px]">
          <img src={kamikitaLogo} className="w-full max-w-[320px] h-auto object-contain mx-auto" alt="KamiKita Logo" />
        </div>
        <div className="p-8">
          <div className="flex mb-6 border-b border-gray-100">
            <button className={`flex-1 pb-3 font-semibold text-sm transition-colors ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => navigate('/login')}>Sign In</button>
            <button className={`flex-1 pb-3 font-semibold text-sm transition-colors ${mode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => navigate('/register')}>Register</button>
          </div>
          {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{authError}</div>}
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={authName} onChange={e => setAuthName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">{showPassword ? <Icons.EyeOff /> : <Icons.Eye />}</button>
              </div>
            </div>

            {mode === 'login' && (
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

            {mode === 'register' && (
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label><input type="text" value={referralCode || authReferral} onChange={e => { setAuthReferral(e.target.value); setReferralCode(''); }} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" placeholder="Optional (Admin default)" /></div>
            )}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-2">{mode === 'login' ? 'Login to Account' : 'Create Account'}</button>



          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-blue-600 font-medium flex items-center justify-center gap-2 mx-auto">
              <span>←</span> Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
