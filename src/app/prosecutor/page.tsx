'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { Scale, LogOut, FileSearch, Gavel, FileWarning, Calendar, ChevronRight, CheckCircle, XCircle, Send } from 'lucide-react';

interface Incident { id: string; description: string; location: string; status: string; createdAt: string; }
interface Case { id: string; classification: string; locked: boolean; incident: Incident; createdAt: string; }

export default function ProsecutorPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'review' | 'legal' | 'court'>('review');
    const [cases, setCases] = useState<Case[]>([]);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [sendbackReason, setSendbackReason] = useState('');
    const [showSendback, setShowSendback] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'PROSECUTOR') {
            router.push('/');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            const res = await api.get('/cases');
            setCases(res.data);
        } catch (err) { }
    };

    const handleSendback = () => {
        if (!sendbackReason) return;
        alert(`Case returned to CID. Reason: ${sendbackReason}`);
        setShowSendback(false);
        setSendbackReason('');
        setSelectedCase(null);
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
                                            <button onClick={() => setSelectedCase(c)} className="bg-[#262626] hover:bg-[#333] px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors border border-[#333] flex items-center">
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
                                                <div className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-lg border border-[#262626]">
                                                    <span className="text-gray-300"><FileWarning className="w-4 h-4 inline mr-2 text-blue-500" /> Crime Scene Photos (4)</span>
                                                    <button className="text-[#eab308] text-sm font-semibold">View File</button>
                                                </div>
                                                <div className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-lg border border-[#262626]">
                                                    <span className="text-gray-300"><FileSearch className="w-4 h-4 inline mr-2 text-green-500" /> Forensic Report FR-992</span>
                                                    <button className="text-[#eab308] text-sm font-semibold">View File</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg">
                                        <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Prosecutorial Decision</h3>
                                        <div className="space-y-3">
                                            <button className="w-full bg-[#10b981] hover:bg-emerald-500 text-[#0a0a0a] border border-[#10b981]/30 py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center hover:scale-105">
                                                <CheckCircle className="w-5 h-5 mr-2" /> File Formal Charges
                                            </button>
                                            <button onClick={() => setShowSendback(true)} className="w-full bg-[#262626] hover:bg-[#333] py-4 rounded-xl font-semibold text-white transition-colors border border-[#333] flex items-center justify-center">
                                                <XCircle className="w-5 h-5 mr-2 text-red-500" /> Insufficient Evidence (Send Back)
                                            </button>
                                            <button className="w-full bg-red-900/20 text-red-500 hover:bg-red-900/50 py-4 rounded-xl font-bold transition-colors border border-red-500/20 flex items-center justify-center">
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
                                    <button className="bg-[#0a0a0a] border border-[#262626] hover:border-[#eab308]/50 p-6 rounded-xl transition-all group">
                                        <h4 className="text-xl font-bold text-gray-300 group-hover:text-[#eab308] mb-2 flex justify-center items-center"><FileWarning className="w-5 h-5 mr-2" /> Generate Warrant</h4>
                                        <p className="text-sm text-gray-500">Draft search or arrest warrants for judicial sign-off.</p>
                                    </button>
                                    <button className="bg-[#0a0a0a] border border-[#262626] hover:border-[#eab308]/50 p-6 rounded-xl transition-all group">
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
                                    <button className="bg-[#eab308] text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-yellow-400 transition-colors">
                                        Sync with Judicial DB
                                    </button>
                                </div>
                                <div className="divide-y divide-[#262626]">
                                    {/* Mock schedule */}
                                    <div className="p-6 flex justify-between items-center hover:bg-[#202020] transition-colors">
                                        <div>
                                            <p className="text-[#eab308] font-bold mb-1">March 12, 2026 @ 09:00 AM</p>
                                            <p className="text-white font-semibold">Arraignment Hearing</p>
                                            <p className="text-sm text-gray-500">Case #A839-B9 • Judge Peterson • Courtroom 4</p>
                                        </div>
                                        <button className="text-gray-400 hover:text-white underline text-sm transition-colors">Modify</button>
                                    </div>
                                    <div className="p-6 flex justify-between items-center hover:bg-[#202020] transition-colors">
                                        <div>
                                            <p className="text-[#eab308] font-bold mb-1">March 15, 2026 @ 14:30 PM</p>
                                            <p className="text-white font-semibold">Evidentiary Hearing</p>
                                            <p className="text-sm text-gray-500">Case #F112-C4 • Judge M. Lin • Courtroom 2A</p>
                                        </div>
                                        <button className="text-gray-400 hover:text-white underline text-sm transition-colors">Modify</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
