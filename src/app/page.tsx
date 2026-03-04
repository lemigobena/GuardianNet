'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { Shield, Fingerprint } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore(state => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      try {
        await api.post('/auth/register', {
          name: email.split('@')[0],
          email,
          password,
          role: email.includes('patrol') ? 'PATROL_OFFICER' :
            email.includes('detective') ? 'DETECTIVE' :
              email.includes('supervisor') ? 'SUPERVISOR' : 'CITIZEN'
        });
      } catch (err) { }

      const res = await api.post('/auth/login', { email, password });
      login(res.data);

      const role = res.data.role;
      if (role === 'CITIZEN') router.push('/citizen');
      else if (role === 'PATROL_OFFICER') router.push('/patrol');
      else if (role === 'DETECTIVE') router.push('/detective');
      else router.push(`/${role.toLowerCase()}`);

    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-[#171717] p-10 rounded-2xl border border-[#262626] w-full max-w-md shadow-2xl z-10 relative">
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
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. patrol@guardian.gov"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Passcode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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

        <div className="mt-8 pt-6 border-t border-[#262626] text-center">
          <p className="text-xs text-gray-500">Demo Accounts (Auto-register on login):</p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <span className="text-[10px] bg-[#262626] text-white px-2 py-1 rounded">citizen@test.com</span>
            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded">patrol@guardian.gov</span>
            <span className="text-[10px] bg-purple-900/30 text-purple-400 px-2 py-1 rounded">detective@guardian.gov</span>
          </div>
        </div>
      </div>
    </div>
  );
}
