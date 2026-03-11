'use client';

import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { AlertTriangle, CheckCircle, Lock } from 'lucide-react';

type ProfileData = Record<string, any>;

const LABELS: Record<string, string> = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone',
  address: 'Address',
  department: 'Department',
  badgeNumber: 'Badge Number',
  station: 'Station',
  rank: 'Rank',
  unit: 'Unit',
  lab: 'Lab',
  specialization: 'Specialization',
  court: 'Court',
  title: 'Title',
  office: 'Office',
  jurisdiction: 'Jurisdiction',
  region: 'Region',
  nationalIdMasked: 'National ID (masked)',
};

export default function ProfilePanel() {
  const { user, updateUser } = useAuthStore() as any;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/profile');
        if (!cancelled) setProfile(res.data);
      } catch (err: any) {
        if (!cancelled) setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load profile.' });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const editableKeys = useMemo(() => {
    if (!profile) return [];
    return Object.keys(profile).filter((k) => !['id', 'role', 'jurisdiction', 'nationalIdMasked'].includes(k));
  }, [profile]);

  const setField = (key: string, value: string) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      editableKeys.forEach((k) => {
        payload[k] = profile[k];
      });
      const res = await api.put('/profile', payload);
      setProfile(res.data);
      if (res.data?.name || res.data?.email) {
        updateUser({ name: res.data.name, email: res.data.email });
      }
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setMessage(null);
    try {
      await api.put('/profile/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'success', text: 'Password updated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password.' });
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-2xl font-bold text-white">Profile</div>
          <div className="text-sm text-gray-400 mt-1">
            ID: <span className="font-mono text-gray-200">{user.id}</span> • Role:{' '}
            <span className="font-mono text-gray-200">{user.role}</span>
          </div>
          {profile?.jurisdiction && (
            <div className="text-sm text-gray-400 mt-2">
              Jurisdiction: <span className="font-mono text-gray-200">{String(profile.jurisdiction)}</span>
            </div>
          )}
          {profile?.nationalIdMasked && (
            <div className="text-sm text-gray-400 mt-1">
              National ID: <span className="font-mono text-gray-200">{String(profile.nationalIdMasked)}</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-500'
              : 'bg-red-500/10 border border-red-500/20 text-red-500'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-3 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="bg-dark-panel border border-dark-border rounded-2xl p-8 shadow-2xl">
        <div className="text-lg font-bold text-gray-200 mb-4">Account Details</div>
        {!profile ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editableKeys.map((k) => (
                <div key={k} className={k === 'address' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {LABELS[k] || k}
                  </label>
                  <input
                    type={k === 'email' ? 'email' : 'text'}
                    value={profile[k] ?? ''}
                    onChange={(e) => setField(k, e.target.value)}
                    className="w-full bg-dark-main border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-dark-border">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-dark-border hover:bg-[#333] text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-dark-panel border border-dark-border rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-4">
          <Lock className="w-5 h-5" />
          Change Password
        </div>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-dark-main border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-dark-main border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="pt-6 border-t border-dark-border">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-8 py-3 bg-[#38bdf8] hover:bg-sky-400 text-dark-main font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

