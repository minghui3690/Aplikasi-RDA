
import React, { useState } from 'react';
import { getSettings } from '../services/mockDatabase';
import { Icons } from '../constants';

interface PaymentModalProps {
    amount: number;
    paymentMethod: 'BANK_TRANSFER' | 'GATEWAY';
    onConfirm: (proof?: string) => void;
    onCancel: () => void;
    redirectUrl?: string; // Optional URL to redirect after payment
}

const PaymentModal: React.FC<PaymentModalProps> = ({ amount, paymentMethod, onConfirm, onCancel, redirectUrl }) => {
    const settings = getSettings();
    const config = settings.paymentConfig;
    const [proof, setProof] = useState('');
    const [step, setStep] = useState<'INSTRUCTION' | 'PROCESSING' | 'SUCCESS'>('INSTRUCTION');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (x) => {
                if (x.target?.result) setProof(x.target.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSuccess = (proofData?: string) => {
        setStep('SUCCESS');
        setTimeout(() => {
            onConfirm(proofData);
            window.location.href = redirectUrl || 'https://richdragon.id/richhd';
        }, 2000);
    };

    const handleManualSubmit = () => {
        if (!proof) {
            alert('Please upload transfer proof.');
            return;
        }
        setStep('PROCESSING');
        setTimeout(() => {
            handleSuccess(proof);
        }, 1500);
    };

    const handleGatewayPay = () => {
        setStep('PROCESSING');
        // Simulate Midtrans Popup behavior
        setTimeout(() => {
            handleSuccess();
        }, 2000);
    };

    if (step === 'SUCCESS') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                        <Icons.Check />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 mb-4">Redirecting you to next step...</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full animate-pulse w-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold">Complete Payment</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white"><Icons.X /></button>
                </div>

                {paymentMethod === 'BANK_TRANSFER' ? (
                    <div className="p-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                            <p className="text-sm text-gray-500 mb-1">Transfer Amount</p>
                            <p className="text-3xl font-bold text-blue-700">Rp {amount.toLocaleString()}</p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-bold text-gray-700">Bank Transfer Details:</p>
                            <div className="border p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500">Bank Name</p>
                                    <p className="font-bold">{config.bankName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Account Holder</p>
                                    <p className="font-bold">{config.accountHolder}</p>
                                </div>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => navigator.clipboard.writeText(config.accountNumber)}>
                                <p className="text-xs text-gray-500 mb-1">Account Number (Click to Copy)</p>
                                <p className="text-xl font-mono font-bold tracking-wider">{config.accountNumber}</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-medium mb-2">Upload Proof of Transfer</label>
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            {proof && <img src={proof} className="mt-2 h-20 w-auto rounded border" alt="Proof" />}
                        </div>

                        <button 
                            onClick={handleManualSubmit}
                            disabled={!proof || step === 'PROCESSING'}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {step === 'PROCESSING' ? 'Verifying...' : 'Confirm Payment'}
                        </button>
                    </div>
                ) : (
                    // MIDTRANS MOCK UI
                    <div className="flex flex-col h-[500px]">
                        <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
                            <div className="bg-white w-full max-w-sm rounded-lg shadow-xl border overflow-hidden">
                                <div className="bg-blue-600 p-3 flex justify-between items-center">
                                    <span className="text-white font-bold text-sm">Midtrans</span>
                                    <span className="text-white/80 text-xs">Test Mode</span>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                                        <span className="text-gray-600">Total</span>
                                        <span className="text-xl font-bold">Rp {amount.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        <div className="p-3 border rounded flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">QR</div>
                                            <div>
                                                <p className="font-bold text-sm">GoPay / QRIS</p>
                                            </div>
                                        </div>
                                        <div className="p-3 border rounded flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">VA</div>
                                            <div>
                                                <p className="font-bold text-sm">Bank Transfer (Virtual Account)</p>
                                            </div>
                                        </div>
                                        <div className="p-3 border rounded flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">CC</div>
                                            <div>
                                                <p className="font-bold text-sm">Credit Card</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleGatewayPay}
                                        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700"
                                    >
                                        Pay Now
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white border-t text-center text-xs text-gray-400">
                            Secure Payment Simulation by Midtrans Snap
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
