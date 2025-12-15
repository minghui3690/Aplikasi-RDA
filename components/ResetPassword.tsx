import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Icons } from '../constants';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus('ERROR');
            setMessage('Passwords do not match');
            return;
        }

        setStatus('LOADING');
        setMessage('');

        try {
            await axios.post('/api/auth/reset-password', { token, newPassword: password });
            setStatus('SUCCESS');
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error: any) {
            setStatus('ERROR');
            setMessage(error.response?.data?.message || 'Invalid or expired token');
        }
    };

    if (!token) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
             <div className="bg-red-100 text-red-700 p-8 rounded-xl">
                 Invalid Reset Link. Missing token.
             </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
                <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
                <p className="text-gray-500 mb-6">Please enter your new password below.</p>

                {status === 'ERROR' && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {message}
                    </div>
                )}
                {status === 'SUCCESS' && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm font-medium">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
                                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                         <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={status === 'LOADING' || status === 'SUCCESS'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-4 disabled:opacity-50"
                    >
                        {status === 'LOADING' ? 'Reseting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
