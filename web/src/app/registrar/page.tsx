'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { AlertTriangle, CheckCircle, LogOut, ShieldCheck, UserPlus, Download, UserCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import ProfilePanel from '../../components/ProfilePanel';

type ProvisionableRole =
  | 'CITIZEN'
  | 'PATROL_OFFICER'
  | 'DETECTIVE'
  | 'FORENSIC_OFFICER'
  | 'JUDICIAL_ADMIN'
  | 'PROSECUTOR'
  | 'SUPERVISOR';

type RoleDetails = {
  // Citizen
  phone?: string;
  address?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  nationalIdNumber?: string;
  jurisdiction?: string;
  identityVerified?: boolean;

  // Patrol / Detective
  badgeNumber?: string;

  // Patrol
  station?: string;
  rank?: string;
  department?: string;
  employmentVerified?: boolean;

  // Detective
  unit?: string;

  // Forensic
  lab?: string;
  specialization?: string;
  // also uses department/employmentVerified/jurisdiction

  // Judicial
  court?: string;
  title?: string;
  // also uses employmentVerified/jurisdiction

  // Prosecutor
  office?: string;

  // Supervisor
  region?: string;
};

const ROLE_META: Record<ProvisionableRole, { title: string; subtitle: string }> = {
  CITIZEN: { title: 'Register Citizen', subtitle: 'General public users' },
  PATROL_OFFICER: { title: 'Register Patrol Officer', subtitle: 'Field law enforcement' },
  DETECTIVE: { title: 'Register Detective', subtitle: 'Investigative officers' },
  FORENSIC_OFFICER: { title: 'Register Forensic Officer', subtitle: 'Lab / forensic staff' },
  JUDICIAL_ADMIN: { title: 'Register Judicial Admin', subtitle: 'Court / judicial staff' },
  PROSECUTOR: { title: 'Register Prosecutor', subtitle: 'Prosecution office' },
  SUPERVISOR: { title: 'Register Supervisor', subtitle: 'Department supervisors' },
};

export default function RegistrarPortal() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'provision' | 'profile'>('provision');
  const [activeRole, setActiveRole] = useState<ProvisionableRole | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [details, setDetails] = useState<RoleDetails>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modal, setModal] = useState<{
    id: string;
    tempPassword: string;
    name: string;
    email: string;
    role: ProvisionableRole;
    details?: RoleDetails;
  } | null>(null);

  const roles = useMemo(() => Object.keys(ROLE_META) as ProvisionableRole[], []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user || user.role !== 'REGISTRAR') {
      router.push('/');
    }
  }, [mounted, user, router]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setTempPassword('');
    setDetails({});
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRole) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password: tempPassword,
        role: activeRole,
        ...details,
      });

      setModal({
        id: res.data.id,
        tempPassword,
        name,
        email,
        role: activeRole,
        details,
      });
      setMessage({ type: 'success', text: `Successfully registered ${activeRole} account for ${name}.` });
      resetForm();
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const apiDetails = err.response?.data?.details;
      setMessage({
        type: 'error',
        text: apiDetails ? `${apiError || 'Registration failed'}: ${apiDetails}` : (apiError || 'Failed to register account.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!modal) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('User Account Details', 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${modal.name}`, 20, 40);
    doc.text(`Email: ${modal.email}`, 20, 50);
    doc.text(`Role: ${modal.role}`, 20, 60);
    doc.text(`User ID: ${modal.id}`, 20, 70);
    doc.text(`Temporary Password: ${modal.tempPassword}`, 20, 80);
    const lines: string[] = [];
    const d = modal.details || {};
    Object.entries(d).forEach(([k, v]) => {
      if (!v) return;
      const label = k
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (c) => c.toUpperCase());
      lines.push(`${label}: ${v}`);
    });
    let y = 95;
    if (lines.length) {
      doc.text('Role Details:', 20, y);
      y += 10;
      lines.slice(0, 6).forEach((line, idx) => doc.text(line, 20, y + idx * 10));
      y += Math.min(lines.length, 6) * 10 + 5;
    }
    doc.text('Please change your password after first login.', 20, Math.max(y, 100));
    doc.save(`user_${modal.id}.pdf`);
  };

  const updateDetail = <K extends keyof RoleDetails>(key: K, value: RoleDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  if (!mounted || !user) return null;

  return (
    <div className="flex h-screen bg-dark-main text-white">
      {/* Sidebar */}
      <div className="w-64 bg-dark-panel border-r border-dark-border flex flex-col shadow-2xl">
        <div className="p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold flex items-center text-[#38bdf8]">
            <ShieldCheck className="w-6 h-6 mr-2" /> Registrar Hub
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">{user.email}</p>
        </div>
        <div className="flex-1 py-4 space-y-2 px-4">
          <div className="bg-[#262626] rounded-xl p-4 border border-[#333]">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Notice</p>
            <p className="text-sm text-gray-300">
              As a Registrar, you provision access for authorized field and legal personnel.
            </p>
          </div>
          <div className="pt-4 space-y-2">
            <button
              onClick={() => { setView('provision'); setActiveRole(null); setMessage(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
                view === 'provision'
                  ? 'bg-[#262626] border-[#333] text-[#38bdf8]'
                  : 'bg-transparent border-[#262626] text-gray-400 hover:text-white hover:bg-[#262626]/50'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-semibold">Provision Accounts</span>
            </button>
            <button
              onClick={() => { setView('profile'); setActiveRole(null); setMessage(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
                view === 'profile'
                  ? 'bg-[#262626] border-[#333] text-[#38bdf8]'
                  : 'bg-transparent border-[#262626] text-gray-400 hover:text-white hover:bg-[#262626]/50'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span className="font-semibold">Profile</span>
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-dark-main to-[#111]">
        <div className="p-10 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
            <UserPlus className="w-8 h-8 mr-3 text-[#38bdf8]" /> Account Provisioning
          </h2>

          {view === 'profile' ? (
            <ProfilePanel />
          ) : !activeRole ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setActiveRole(role);
                    setMessage(null);
                    resetForm();
                  }}
                  className="bg-[#171717] hover:bg-[#23272b] border border-[#262626] rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4 transition-colors"
                >
                  <UserPlus className="w-10 h-10 text-[#38bdf8]" />
                  <span className="text-xl font-bold">{ROLE_META[role].title}</span>
                  <span className="text-gray-400 text-sm text-center">{ROLE_META[role].subtitle}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl">
              <button
                onClick={() => {
                  setActiveRole(null);
                  setMessage(null);
                  resetForm();
                }}
                className="mb-6 text-sm text-[#38bdf8] hover:underline"
              >
                &larr; Back to role selection
              </button>

              <div className="mb-6">
                <div className="text-2xl font-bold">{ROLE_META[activeRole].title}</div>
                <div className="text-sm text-gray-400">{ROLE_META[activeRole].subtitle}</div>
              </div>

              {message && (
                <div
                  className={`mb-6 p-4 rounded-xl flex items-center ${
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

              <form onSubmit={handleProvision} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        required
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@guardian.com"
                        required
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Identification Photo
                    </label>
                    <div className="flex items-center gap-4">
                      {photoPreview && (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-14 h-14 rounded-full object-cover border border-dark-border"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*;capture=camera"
                          required
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setPhotoFile(file);
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => setPhotoPreview(reader.result as string);
                              reader.readAsDataURL(file);
                            } else {
                              setPhotoPreview(null);
                            }
                          }}
                          className="block w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1f2933] file:text-gray-200 hover:file:bg-[#111827]"
                        />
                        <p className="mt-1 text-[10px] text-gray-500">
                          Used only for internal identity verification within GuardianNet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-specific questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jurisdiction</label>
                    <input
                      type="text"
                      value={details.jurisdiction || ''}
                      onChange={(e) => updateDetail('jurisdiction', e.target.value)}
                      placeholder="e.g. District A / County 1"
                      className="w-full bg-dark-main border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                    />
                  </div>
                  {activeRole === 'CITIZEN' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">National ID Number</label>
                      <input
                        type="text"
                        value={details.nationalIdNumber || ''}
                        onChange={(e) => updateDetail('nationalIdNumber', e.target.value)}
                        placeholder="e.g. 1234-5678-9012"
                        className="w-full bg-dark-main border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  )}
                  {(activeRole === 'PATROL_OFFICER' ||
                    activeRole === 'DETECTIVE' ||
                    activeRole === 'FORENSIC_OFFICER' ||
                    activeRole === 'SUPERVISOR') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Department</label>
                      <input
                        type="text"
                        value={details.department || ''}
                        onChange={(e) => updateDetail('department', e.target.value)}
                        placeholder="e.g. Operations / CID / Field Unit"
                        className="w-full bg-dark-main border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeRole === 'CITIZEN' && (
                    <label className="flex items-center gap-3 bg-dark-main border border-dark-border rounded-xl px-4 py-3 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={Boolean(details.identityVerified)}
                        onChange={(e) => updateDetail('identityVerified', e.target.checked)}
                        className="w-4 h-4 accent-[#38bdf8]"
                      />
                      Identity verified (Registrar-confirmed)
                    </label>
                  )}
                  {activeRole !== 'CITIZEN' && (
                    <label className="flex items-center gap-3 bg-dark-main border border-dark-border rounded-xl px-4 py-3 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={Boolean(details.employmentVerified)}
                        onChange={(e) => updateDetail('employmentVerified', e.target.checked)}
                        className="w-4 h-4 accent-[#38bdf8]"
                      />
                      Employment verified (Registrar-confirmed)
                    </label>
                  )}
                </div>

                {activeRole === 'CITIZEN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
                      <input
                        type="tel"
                        value={details.phone || ''}
                        onChange={(e) => updateDetail('phone', e.target.value)}
                        placeholder="e.g. +1 555 0100"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={details.dateOfBirth || ''}
                        onChange={(e) => updateDetail('dateOfBirth', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Home Address</label>
                      <input
                        type="text"
                        value={details.address || ''}
                        onChange={(e) => updateDetail('address', e.target.value)}
                        placeholder="e.g. 123 Main St, City"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {(activeRole === 'PATROL_OFFICER' || activeRole === 'DETECTIVE') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Badge Number</label>
                      <input
                        type="text"
                        value={details.badgeNumber || ''}
                        onChange={(e) => updateDetail('badgeNumber', e.target.value)}
                        placeholder="e.g. 12345"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    {activeRole === 'PATROL_OFFICER' ? (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Station</label>
                          <input
                            type="text"
                            value={details.station || ''}
                            onChange={(e) => updateDetail('station', e.target.value)}
                            placeholder="e.g. Central Precinct"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rank</label>
                          <input
                            type="text"
                            value={details.rank || ''}
                            onChange={(e) => updateDetail('rank', e.target.value)}
                            placeholder="e.g. Sergeant"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Unit</label>
                        <input
                          type="text"
                          value={details.unit || ''}
                          onChange={(e) => updateDetail('unit', e.target.value)}
                          placeholder="e.g. Major Crimes"
                          className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeRole === 'FORENSIC_OFFICER' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lab</label>
                      <input
                        type="text"
                        value={details.lab || ''}
                        onChange={(e) => updateDetail('lab', e.target.value)}
                        placeholder="e.g. Central Lab"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Specialization</label>
                      <input
                        type="text"
                        value={details.specialization || ''}
                        onChange={(e) => updateDetail('specialization', e.target.value)}
                        placeholder="e.g. DNA, Digital Forensics"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {activeRole === 'JUDICIAL_ADMIN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Court</label>
                      <input
                        type="text"
                        value={details.court || ''}
                        onChange={(e) => updateDetail('court', e.target.value)}
                        placeholder="e.g. District Court"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
                      <input
                        type="text"
                        value={details.title || ''}
                        onChange={(e) => updateDetail('title', e.target.value)}
                        placeholder="e.g. Clerk, Judge"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {activeRole === 'PROSECUTOR' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Office</label>
                      <input
                        type="text"
                        value={details.office || ''}
                        onChange={(e) => updateDetail('office', e.target.value)}
                        placeholder="e.g. District Attorney Office"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jurisdiction</label>
                      <input
                        type="text"
                        value={details.jurisdiction || ''}
                        onChange={(e) => updateDetail('jurisdiction', e.target.value)}
                        placeholder="e.g. County A"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {activeRole === 'SUPERVISOR' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Department</label>
                      <input
                        type="text"
                        value={details.department || ''}
                        onChange={(e) => updateDetail('department', e.target.value)}
                        placeholder="e.g. Operations"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Region</label>
                      <input
                        type="text"
                        value={details.region || ''}
                        onChange={(e) => updateDetail('region', e.target.value)}
                        placeholder="e.g. North District"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Temporary Passcode
                    </label>
                    <input
                      type="password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      The new user should change this after first login.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#262626]">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-[#38bdf8] hover:bg-sky-400 text-[#0a0a0a] font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Credentials Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="bg-[#171717] border border-[#333] rounded-xl p-8 max-w-md w-full relative">
            <h3 className="text-lg font-bold text-gray-200 mb-4">User Registered</h3>
            <div className="mb-2 text-gray-300">
              <b>Name:</b> {modal.name}
            </div>
            <div className="mb-2 text-gray-300">
              <b>Email:</b> {modal.email}
            </div>
            <div className="mb-2 text-gray-300">
              <b>Role:</b> {modal.role}
            </div>
            <div className="mb-2 text-gray-300">
              <b>User ID:</b> <span className="font-mono text-green-400">{modal.id}</span>
            </div>
            <div className="mb-4 text-gray-300">
              <b>Temporary Password:</b> <span className="font-mono text-yellow-400">{modal.tempPassword}</span>
            </div>
            {modal.details && Object.values(modal.details).some(Boolean) && (
              <div className="mb-4 text-gray-300">
                <div className="font-bold mb-2">Role Details</div>
                <div className="space-y-1 text-sm">
                  {Object.entries(modal.details)
                    .filter(([, v]) => Boolean(v))
                    .map(([k, v]) => (
                      <div key={k}>
                        <b>
                          {k
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            .replace(/^./, (c) => c.toUpperCase())}
                          :
                        </b>{' '}
                        {String(v)}
                      </div>
                    ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadPDF}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => setModal(null)}
                className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
