import React, { useState } from 'react';
import axios from 'axios';
import { Icons } from '../constants';

interface ForgotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotModal: React.FC<ForgotModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');
        setMessage('');

        try {
            await axios.post('/api/auth/forgot-password', { email });
            setStatus('SUCCESS');
            setMessage('Instructions have been logged to the server console (Simulated Email). Please check Render Logs.');
        } catch (error: any) {
            setStatus('ERROR');
            setMessage(error.response?.data?.message || 'Error processing request');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <Icons.X />
                </button>
                
                <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                
                {status === 'SUCCESS' ? (
                    <div className="text-center py-6">
                        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
                            ✅ {message}
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Because this is a demo environment without SMTP, the reset link is printed in the <b>Dashboard Logs</b> instead of sent via email.</p>
                        <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 w-full">
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p className="text-gray-600 mb-4 text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        
                        {status === 'ERROR' && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                                {message}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                required 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={status === 'LOADING'}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                            >
                                {status === 'LOADING' ? 'Sending...' : 'Send Link'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotModal;
