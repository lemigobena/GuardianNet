import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { Fingerprint, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface BiometricModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (token: string) => void;
    title?: string;
}

export default function BiometricModal({ isOpen, onClose, onSuccess, title = "Biometric Confirmation Required" }: BiometricModalProps) {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const setBiometricToken = useAuthStore(state => state.setBiometricToken);

    if (!isOpen) return null;

    const handleScan = async () => {
        setStatus('scanning');
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const res = await api.post('/auth/biometric');
            setBiometricToken(res.data.biometricToken);
            setStatus('success');

            setTimeout(() => {
                onSuccess(res.data.biometricToken);
                setStatus('idle');
                onClose();
            }, 1000);
        } catch (err) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#171717] border border-[#262626] rounded-xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">

                <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
                <p className="text-sm text-gray-400 mb-8">Please scan your fingerprint or face to proceed with this critical action.</p>

                <div
                    onClick={status === 'idle' ? handleScan : undefined}
                    className={`mx-auto w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${status === 'idle' ? 'border-blue-500/30 cursor-pointer hover:border-blue-500 hover:scale-105' :
                            status === 'scanning' ? 'border-blue-500 animate-pulse' :
                                status === 'success' ? 'border-green-500 bg-green-500/10' :
                                    'border-red-500 bg-red-500/10'
                        }`}
                >
                    {status === 'idle' && <Fingerprint className="w-16 h-16 text-blue-500" />}
                    {status === 'scanning' && <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="w-16 h-16 text-green-500" />}
                    {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
                </div>

                {status === 'idle' && <p className="mt-6 text-xs font-semibold text-blue-400 uppercase tracking-wider">Tap to Scan</p>}
                {status === 'scanning' && <p className="mt-6 text-xs font-semibold text-blue-400 uppercase tracking-wider">Verifying Identity...</p>}
                {status === 'success' && <p className="mt-6 text-xs font-semibold text-green-400 uppercase tracking-wider">Identity Confirmed</p>}
                {status === 'error' && <p className="mt-6 text-xs font-semibold text-red-400 uppercase tracking-wider">Match Failed - Try Again</p>}

                <button
                    onClick={onClose}
                    className="mt-8 text-sm text-gray-500 hover:text-white transition-colors"
                >
                    Cancel Operation
                </button>
            </div>
        </div>
    );
}
