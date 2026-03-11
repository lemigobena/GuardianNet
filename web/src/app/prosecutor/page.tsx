'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { Scale, LogOut, FileSearch, Gavel, FileWarning, Calendar, ChevronRight, CheckCircle, XCircle, Send, LayoutDashboard, TrendingUp, FolderOpen, AlertCircle, Users, Plus, UserCircle } from 'lucide-react';
import ProfilePanel from '../../components/ProfilePanel';
import Modal from '../../components/Modal';

interface Incident { id: string; description: string; location: string; status: string; createdAt: string; }
interface Case { id: string; classification: string; locked: boolean; incident: Incident; createdAt: string; }
interface CourtRecord { id: string; caseId: string; type: string; status: string; date: string; }

export default function ProsecutorPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'legal' | 'court' | 'profile'>('dashboard');
    const [cases, setCases] = useState<Case[]>([]);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [sendbackReason, setSendbackReason] = useState('');
    const [showSendback, setShowSendback] = useState(false);
    const [caseEvidence, setCaseEvidence] = useState<any[]>([]);
    const [caseReports, setCaseReports] = useState<any[]>([]);
    const [caseSuspects, setCaseSuspects] = useState<any[]>([]);
    const [courtSch, setCourtSch] = useState<any[]>([]);
    const [modal, setModal] = useState<{ title: string; message?: string; action?: 'CHARGE' | 'DECLINE' | 'WARRANT' | 'SUBPOENA' | 'HEARING' | null; } | null>(null);
    const [formText1, setFormText1] = useState('');
    const [formText2, setFormText2] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'PROSECUTOR') {
            router.push('/');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            const [caseRes, courtRes] = await Promise.all([
                api.get('/cases'),
                api.get('/court')
            ]);
            setCases(caseRes.data);
            setCourtSch(courtRes.data?.filter((c: any) => c.scheduleTime) || []);
        } catch (err) { }
    };

    const handleSendback = () => {
        if (!sendbackReason) return;
        setModal({ title: 'Case Returned', message: `Case returned to CID. Reason: ${sendbackReason}` });
        setShowSendback(false);
        setSendbackReason('');
        setSelectedCase(null);
    };

    const handleSelectCase = async (c: Case) => {
        setSelectedCase(c);
        try {
            const [evRes, repRes, suspectsRes] = await Promise.all([
                api.get(`/evidence/case/${c.id}`),
                api.get(`/forensics/case/${c.id}`),
                api.get(`/suspects/case/${c.id}`)
            ]);
            setCaseEvidence(evRes.data);
            setCaseReports(repRes.data);
            setCaseSuspects(suspectsRes.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const startCharge = () => { if (selectedCase) setModal({ title: 'File Formal Charges', action: 'CHARGE' }); };
    const handleFileCharges = async () => {
        if (!selectedCase || !formText1) return;
        try {
            await api.post('/court', {
                caseId: selectedCase.id,
                charge: formText1,
                verdict: 'PENDING'
            });
            setModal({ title: 'Charge Filed', message: 'Formal charges filed. Case forwarded to Judicial Administration.' });
            setSelectedCase(null);
            setFormText1('');
            fetchData();
        } catch (err) { setModal({ title: 'Error', message: 'Failed to file charges.' }); }
    };

    const startDecline = () => { if (selectedCase) setModal({ title: 'Decline Prosecution', action: 'DECLINE' }); };
    const handleDeclineProsecute = async () => {
        if (!selectedCase || !formText1) return;
        try {
            await api.patch(`/cases/${selectedCase.id}/decline`, {
                reason: formText1,
                userId: user?.id,
                userRole: user?.role
            });
            setModal({ title: 'Case Declined', message: `Case #${selectedCase.id.split('-')[0].toUpperCase()} declined. Reason logged: ${formText1}` });
            setSelectedCase(null);
            setFormText1('');
            fetchData();
        } catch (err) {
            setModal({ title: 'Error', message: 'Failed to decline prosecution.' });
            console.error(err);
        }
    };

    const startWarrant = () => setModal({ title: 'Generate Warrant', action: 'WARRANT' });
    const handleGenerateWarrant = () => {
        if (formText1) setModal({ title: 'Warrant Generated', message: `Warrant draft generated for: ${formText1}. Pending Judicial approval.` });
        setFormText1('');
    };

    const startSubpoena = () => setModal({ title: 'Issue Subpoena', action: 'SUBPOENA' });
    const handleIssueSubpoena = () => {
        if (formText1) setModal({ title: 'Subpoena Issued', message: `Subpoena drafted for ${formText1}. Automatically added to court queue.` });
        setFormText1('');
    };

    const startHearing = () => setModal({ title: 'Schedule Hearing', action: 'HEARING' });
    const handleScheduleHearing = () => {
        if (formText1 && formText2) setModal({ title: 'Hearing Scheduled', message: `Hearing (${formText1}) successfully scheduled for ${formText2}. Notifications sent.` });
        setFormText1('');
        setFormText2('');
    };

    const handleSyncSchedule = () => {
        setModal({ title: 'System Synced', message: 'Synchronizing with Master Judicial Database... \n✅ Synchronized successfully.' });
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-10">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#eab308]">
                        <Scale className="w-6 h-6 mr-2" /> DA Office
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setSelectedCase(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'dashboard' ? 'bg-[#262626] text-[#eab308] border-r-2 border-[#eab308]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Executive Dashboard</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('review'); setSelectedCase(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'review' ? 'bg-[#262626] text-[#eab308] border-r-2 border-[#eab308]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <FileSearch className="w-5 h-5" />
                        <span>Case Review Docket</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('legal'); setSelectedCase(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'legal' ? 'bg-[#262626] text-[#eab308] border-r-2 border-[#eab308]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <FileWarning className="w-5 h-5" />
                        <span>Warrants & Subpoenas</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('court'); setSelectedCase(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'court' ? 'bg-[#262626] text-[#eab308] border-r-2 border-[#eab308]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span>Court Scheduling</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('profile'); setSelectedCase(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'profile' ? 'bg-[#262626] text-[#eab308] border-r-2 border-[#eab308]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <UserCircle className="w-5 h-5" />
                        <span>Profile</span>
                    </button>
                </div>
                <div className="p-4 border-t border-[#262626]">
                    <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Secure Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5 relative">
                <div className="p-10 max-w-6xl mx-auto">

                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <UserCircle className="w-8 h-8 mr-3 text-[#eab308]" /> Profile & Security
                            </h2>
                            <ProfilePanel />
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <LayoutDashboard className="w-8 h-8 mr-3 text-[#eab308]" /> Office Overview
                            </h2>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><FolderOpen className="w-16 h-16 text-[#eab308]" /></div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Prosecutions</p>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-4xl font-black text-white">{cases.filter(c => c.locked).length || 24}</span>
                                        <span className="text-sm font-semibold text-green-500 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> 12%</span>
                                    </div>
                                </div>
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Scale className="w-16 h-16 text-[#eab308]" /></div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Conviction Rate (YTD)</p>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-4xl font-black text-white">87%</span>
                                        <span className="text-sm font-semibold text-green-500 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> 2%</span>
                                    </div>
                                </div>
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><FileWarning className="w-16 h-16 text-[#eab308]" /></div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending Warrants</p>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-4xl font-black text-white">12</span>
                                    </div>
                                </div>
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="w-16 h-16 text-[#eab308]" /></div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Upcoming Hearings</p>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-4xl font-black text-white">{courtSch.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Urgent Alerts Box */}
                                <div className="bg-[#171717] border border-red-900/50 p-6 rounded-2xl shadow-lg">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-red-500" /> Urgent Items & Fast-Track</h3>
                                    <div className="space-y-4">
                                        <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl cursor-pointer hover:bg-red-900/20 transition-colors" onClick={() => setActiveTab('review')}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-red-400">Statute Limitations Warning</h4>
                                                <span className="text-xs font-mono bg-red-900/50 text-red-200 px-2 py-0.5 rounded">AUTO-ALERT</span>
                                            </div>
                                            <p className="text-sm text-gray-400">Arson investigation requires charging decision within 48 hours before suspect release.</p>
                                        </div>
                                        <div className="bg-orange-900/10 border border-orange-500/20 p-4 rounded-xl cursor-pointer hover:bg-orange-900/20 transition-colors" onClick={() => setActiveTab('legal')}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-orange-400">Grand Jury Subpoena Needed</h4>
                                                <span className="text-xs font-mono bg-orange-900/50 text-orange-200 px-2 py-0.5 rounded">ACTION REQUIRED</span>
                                            </div>
                                            <p className="text-sm text-gray-400">Key witness testimony requires immediate subpoena drafting ahead of Friday's deadline.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Workload Status */}
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Scale className="w-5 h-5 mr-2 text-[#eab308]" /> Department Caseload</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">Major Crimes</span>
                                                <span className="text-white font-mono">14 Cases</span>
                                            </div>
                                            <div className="w-full bg-[#0a0a0a] rounded-full h-2 border border-[#262626]">
                                                <div className="bg-[#eab308] h-full rounded-full" style={{ width: '45%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">Narcotics & Organized</span>
                                                <span className="text-white font-mono">22 Cases</span>
                                            </div>
                                            <div className="w-full bg-[#0a0a0a] rounded-full h-2 border border-[#262626]">
                                                <div className="bg-blue-500 h-full rounded-full" style={{ width: '65%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">Financial Crimes</span>
                                                <span className="text-white font-mono">6 Cases</span>
                                            </div>
                                            <div className="w-full bg-[#0a0a0a] rounded-full h-2 border border-[#262626]">
                                                <div className="bg-green-500 h-full rounded-full" style={{ width: '20%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">Special Victims Unit</span>
                                                <span className="text-white font-mono">18 Cases</span>
                                            </div>
                                            <div className="w-full bg-[#0a0a0a] rounded-full h-2 border border-[#262626]">
                                                <div className="bg-purple-500 h-full rounded-full" style={{ width: '55%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && !selectedCase && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <FileSearch className="w-8 h-8 mr-3 text-[#eab308]" /> Pending Review Docket
                            </h2>
                            <div className="grid grid-cols-1 gap-6">
                                {/* Only showing locked cases which means CID submitted them to prosecution */}
                                {cases.filter(c => c.locked).map((c: Case) => (
                                    <div key={c.id} className="bg-[#171717] border border-[#262626] p-6 rounded-2xl flex justify-between items-center shadow-lg hover:border-[#eab308]/50 transition-colors group">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className="text-xs bg-yellow-900/30 text-yellow-500 font-bold px-2 py-1 rounded border border-yellow-500/20">CASE #{c.id.split('-')[0].toUpperCase()}</span>
                                                <span className="text-xs text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Submitted {new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-200">{c.classification || 'Unclassified Investigation'}</h3>
                                            <p className="text-sm text-gray-400 mt-2 max-w-2xl truncate">{c.incident?.description}</p>
                                        </div>
                                        <div className="flex space-x-3 ml-4">
                                            <button onClick={() => handleSelectCase(c)} className="bg-[#262626] hover:bg-[#333] px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors border border-[#333] flex items-center">
                                                Open File <ChevronRight className="w-4 h-4 ml-2" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {cases.filter(c => c.locked).length === 0 && (
                                    <div className="text-center py-12 border border-dashed border-[#262626] rounded-2xl bg-[#171717]">
                                        <Scale className="w-12 h-12 text-[#eab308] opacity-50 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">No cases pending prosecutorial review.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && selectedCase && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <button onClick={() => setSelectedCase(null)} className="text-sm text-gray-500 hover:text-white mb-4 flex items-center transition-colors">
                                <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Docket
                            </button>
                            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center mb-6 border-b border-[#262626] pb-4">
                                Reviewing Case <span className="ml-3 font-mono text-[#eab308]">{selectedCase.id.split('-')[0].toUpperCase()}</span>
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg">
                                        <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Investigation Summary</h3>
                                        <p className="text-gray-200 text-lg mb-4">{selectedCase.incident?.description}</p>
                                        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#262626]">
                                            <p className="text-sm text-gray-500 font-mono">LOCATION: {selectedCase.incident?.location}</p>
                                            <p className="text-sm text-gray-500 font-mono">STATUS: {selectedCase.locked ? 'LOCKED (EVIDENCE SECURED)' : 'ACTIVE'}</p>
                                            <p className="text-sm text-gray-500 font-mono">CID REF: {selectedCase.classification}</p>
                                        </div>
                                    </div>

                                    {showSendback ? (
                                        <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4">
                                            <h3 className="text-lg font-bold text-red-500 mb-4">Request Additional Evidence</h3>
                                            <textarea
                                                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-red-500 mb-4"
                                                rows={4}
                                                placeholder="Detail exactly what evidence is missing to file charges..."
                                                value={sendbackReason}
                                                onChange={(e) => setSendbackReason(e.target.value)}
                                            />
                                            <div className="flex space-x-3 justify-end">
                                                <button onClick={() => setShowSendback(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white">Cancel</button>
                                                <button onClick={handleSendback} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center">
                                                    <Send className="w-4 h-4 mr-2" /> Send Back to CID
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg">
                                            <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Digital Evidence Registry</h3>
                                            <div className="space-y-3">
                                                {caseEvidence.map((ev: any) => (
                                                    <div key={ev.id} className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-lg border border-[#262626]">
                                                        <span className="text-gray-300"><FileWarning className="w-4 h-4 inline mr-2 text-blue-500" /> {ev.description || ev.type} ({ev.type})</span>
                                                        <button className="text-[#eab308] text-sm font-semibold">View File</button>
                                                    </div>
                                                ))}
                                                {caseReports.map((rep: any) => (
                                                    <div key={rep.id} className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-lg border border-[#262626]">
                                                        <span className="text-gray-300"><FileSearch className="w-4 h-4 inline mr-2 text-green-500" /> Forensic Report - {rep.status}</span>
                                                        <button className="text-[#eab308] text-sm font-semibold">View File</button>
                                                    </div>
                                                ))}
                                                {caseEvidence.length === 0 && caseReports.length === 0 && (
                                                    <p className="text-gray-500 text-center py-4">No evidence files attached.</p>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-300 mt-6 mb-4 border-b border-[#262626] pb-2">Suspect Registry</h3>
                                            <div className="space-y-3">
                                                {caseSuspects.map((susp: any, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-lg border border-[#262626]">
                                                        <div>
                                                            <p className="text-gray-300 font-bold"><Users className="w-4 h-4 inline mr-2 text-red-500" /> {susp.name}</p>
                                                            {susp.biometricReference && <p className="text-sm text-gray-500 ml-6">Biometric Ref: {susp.biometricReference}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {caseSuspects.length === 0 && (
                                                    <p className="text-gray-500 text-center py-4">No suspects registered.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg">
                                        <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Prosecutorial Decision</h3>
                                        <div className="space-y-3">
                                            <button onClick={startCharge} className="w-full bg-[#10b981] hover:bg-emerald-500 text-[#0a0a0a] border border-[#10b981]/30 py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center hover:scale-105">
                                                <CheckCircle className="w-5 h-5 mr-2" /> File Formal Charges
                                            </button>
                                            <button onClick={() => setShowSendback(true)} className="w-full bg-[#262626] hover:bg-[#333] py-4 rounded-xl font-semibold text-white transition-colors border border-[#333] flex items-center justify-center">
                                                <XCircle className="w-5 h-5 mr-2 text-red-500" /> Insufficient Evidence (Send Back)
                                            </button>
                                            <button onClick={startDecline} className="w-full bg-red-900/20 text-red-500 hover:bg-red-900/50 py-4 rounded-xl font-bold transition-colors border border-red-500/20 flex items-center justify-center">
                                                Decline to Prosecute
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'legal' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <FileWarning className="w-8 h-8 mr-3 text-[#eab308]" /> Legal Status Manager
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl text-center">
                                <Scale className="w-16 h-16 text-[#eab308] mx-auto mb-4 opacity-50" />
                                <h3 className="text-2xl font-bold text-gray-200 mb-2">Warrants & Subpoenas Database</h3>
                                <p className="text-gray-500 max-w-lg mx-auto mb-8">Draft, issue, and track legal documents associated with active investigations. All artifacts are securely appended to the case directory.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                                    <button onClick={startWarrant} className="bg-[#0a0a0a] border border-[#262626] hover:border-[#eab308]/50 p-6 rounded-xl transition-all group">
                                        <h4 className="text-xl font-bold text-gray-300 group-hover:text-[#eab308] mb-2 flex justify-center items-center"><FileWarning className="w-5 h-5 mr-2" /> Generate Warrant</h4>
                                        <p className="text-sm text-gray-500">Draft search or arrest warrants for judicial sign-off.</p>
                                    </button>
                                    <button onClick={startSubpoena} className="bg-[#0a0a0a] border border-[#262626] hover:border-[#eab308]/50 p-6 rounded-xl transition-all group">
                                        <h4 className="text-xl font-bold text-gray-300 group-hover:text-[#eab308] mb-2 flex justify-center items-center"><Gavel className="w-5 h-5 mr-2" /> Issue Subpoena</h4>
                                        <p className="text-sm text-gray-500">Compel witness testimony or document production.</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'court' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Calendar className="w-8 h-8 mr-3 text-[#eab308]" /> Court Scheduling Sync
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <div className="p-6 bg-[#0a0a0a] border-b border-[#262626] flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-300">Upcoming Hearings</h3>
                                    <div className="flex space-x-3">
                                        <button onClick={startHearing} className="bg-[#262626] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-[#333] transition-colors border border-[#333]">
                                            <Plus className="w-4 h-4 mr-2" /> Schedule Hearing
                                        </button>
                                        <button onClick={handleSyncSchedule} className="bg-[#eab308] text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-yellow-400 transition-colors">
                                            <Calendar className="w-4 h-4 mr-2" /> Sync with Judicial DB
                                        </button>
                                    </div>
                                </div>
                                <div className="divide-y divide-[#262626]">
                                    {courtSch.map((c: any) => (
                                        <div key={c.id} className="p-6 flex justify-between items-center hover:bg-[#202020] transition-colors">
                                            <div>
                                                <p className="text-[#eab308] font-bold mb-1">{new Date(c.scheduleTime).toLocaleString()}</p>
                                                <p className="text-white font-semibold">{c.hearingType || 'Legal Hearing'}</p>
                                                <p className="text-sm text-gray-500">Case #{c.caseId.split('-')[0].toUpperCase()} • Division {c.caseId.slice(-4)}</p>
                                            </div>
                                            <button onClick={() => setModal({ title: 'Reschedule', message: 'Interactive rescheduling calendar not available yet.' })} className="text-gray-400 hover:text-white underline text-sm transition-colors">Modify</button>
                                        </div>
                                    ))}
                                    {courtSch.length === 0 && (
                                        <div className="p-10 text-center text-gray-500">No upcoming hearings scheduled.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <Modal
                open={modal !== null}
                title={modal?.title || ''}
                message={modal?.message}
                onClose={() => { setModal(null); setFormText1(''); setFormText2(''); }}
            >
                {modal?.action === 'CHARGE' && (
                    <div className="space-y-4">
                        <textarea
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-[#eab308]"
                            rows={3}
                            placeholder="Enter formal charge description..."
                            value={formText1}
                            onChange={(e) => setFormText1(e.target.value)}
                        />
                        <button onClick={handleFileCharges} className="w-full bg-[#10b981] hover:bg-emerald-500 text-[#0a0a0a] py-3 rounded-lg font-bold">Submit Charge</button>
                    </div>
                )}
                {modal?.action === 'DECLINE' && (
                    <div className="space-y-4">
                        <textarea
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-red-500"
                            rows={3}
                            placeholder="Enter reason for declining prosecution..."
                            value={formText1}
                            onChange={(e) => setFormText1(e.target.value)}
                        />
                        <button onClick={handleDeclineProsecute} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold">Decline Prosecution</button>
                    </div>
                )}
                {modal?.action === 'WARRANT' && (
                    <div className="space-y-4">
                        <input
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-[#eab308]"
                            placeholder="Enter target suspect or location..."
                            value={formText1}
                            onChange={(e) => setFormText1(e.target.value)}
                        />
                        <button onClick={handleGenerateWarrant} className="w-full bg-[#eab308] hover:bg-yellow-400 text-[#0a0a0a] py-3 rounded-lg font-bold">Generate Warrant</button>
                    </div>
                )}
                {modal?.action === 'SUBPOENA' && (
                    <div className="space-y-4">
                        <input
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-[#eab308]"
                            placeholder="Enter witness or entity name..."
                            value={formText1}
                            onChange={(e) => setFormText1(e.target.value)}
                        />
                        <button onClick={handleIssueSubpoena} className="w-full bg-[#eab308] hover:bg-yellow-400 text-[#0a0a0a] py-3 rounded-lg font-bold">Issue Subpoena</button>
                    </div>
                )}
                {modal?.action === 'HEARING' && (
                    <div className="space-y-4">
                        <input
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-[#eab308]"
                            placeholder="Hearing type (e.g. Arraignment, Trial)"
                            value={formText1}
                            onChange={(e) => setFormText1(e.target.value)}
                        />
                        <input
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-[#eab308]"
                            placeholder="Date/Time (YYYY-MM-DD HH:MM)"
                            value={formText2}
                            onChange={(e) => setFormText2(e.target.value)}
                        />
                        <button onClick={handleScheduleHearing} className="w-full bg-[#eab308] hover:bg-yellow-400 text-[#0a0a0a] py-3 rounded-lg font-bold">Schedule Hearing</button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
