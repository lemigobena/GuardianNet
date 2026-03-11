'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { Shield, Fingerprint } from 'lucide-react';


export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore(state => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Only admin can login with email, others use ID
      let payload: any = {};
      if (loginId.includes('@')) {
        payload = { email: loginId, password };
      } else {
        payload = { id: loginId, password };
      }
      const res = await api.post('/auth/login', payload);
      login(res.data);
      const role = res.data.role;
      const rolePaths: Record<string, string> = {
        'CITIZEN': '/citizen',
        'PATROL_OFFICER': '/patrol',
        'DETECTIVE': '/detective',
        'SUPERVISOR': '/supervisor',
        'FORENSIC_OFFICER': '/forensic',
        'PROSECUTOR': '/prosecutor',
        'JUDICIAL_ADMIN': '/judicial',
        'SYSTEM_ADMIN': '/admin',
        'REGISTRAR': '/registrar'
      };
      router.push(rolePaths[role] || '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-main relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-dark-panel p-10 rounded-2xl border border-dark-border w-full max-w-md shadow-2xl z-10 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-500/10 p-4 rounded-full mb-4">
            <Shield className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">GuardianNet</h1>
          <p className="text-gray-400 mt-2 text-sm text-center">Secure Civic Justice Infrastructure</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {loginId.includes('@') ? 'Admin Email' : 'User ID'}
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="{ Admin: mainadmin@guardiannet.com, Others: Enter ID }"
              className="w-full bg-dark-main border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Passcode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-main border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <>
                <Fingerprint className="w-5 h-5" />
                <span>Authenticate</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dark-border text-center">
          <p className="text-xs text-gray-500">Secure Environment. Contact your local Registrar for account creation.</p>
        </div>
      </div>
    </div>
  );
}
