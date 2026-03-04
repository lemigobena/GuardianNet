'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { FlaskConical, LogOut, UploadCloud, Microscope, Inbox, Fingerprint, FileText, CheckCircle, SearchCode } from 'lucide-react';

interface Case { id: string; classification: string; status: string; incident: any; createdAt: string; }

export default function ForensicPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'intake' | 'workspace' | 'reports'>('intake');
    const [cases, setCases] = useState<Case[]>([]);

    // Mock processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [matchResult, setMatchResult] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'FORENSIC_OFFICER') {
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

    const runAnalysis = () => {
        setIsProcessing(true);
        setMatchResult(null);
        setTimeout(() => {
            setIsProcessing(false);
            setMatchResult("99.8% Match: Suspect ID #88432-A (Prior Conviction)");
        }, 3000);
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#14b8a6]">
                        <FlaskConical className="w-6 h-6 mr-2" /> Forensics Div
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('intake')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'intake' ? 'bg-[#262626] text-[#14b8a6] border-r-2 border-[#14b8a6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Inbox className="w-5 h-5" />
                        <span>Evidence Intake</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'workspace' ? 'bg-[#262626] text-[#14b8a6] border-r-2 border-[#14b8a6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Microscope className="w-5 h-5" />
                        <span>Lab Workspace</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'reports' ? 'bg-[#262626] text-[#14b8a6] border-r-2 border-[#14b8a6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>Sign & Upload</span>
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
            <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                <div className="p-10 max-w-6xl mx-auto">

                    {activeTab === 'intake' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Inbox className="w-8 h-8 mr-3 text-[#14b8a6]" /> Physical & Digital Intake
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cases.map((c: Case) => (
                                    <div key={c.id} className="bg-[#171717] border border-[#262626] p-6 rounded-2xl flex flex-col justify-between shadow-lg hover:border-[#14b8a6]/50 transition-colors group">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-xs font-mono bg-teal-900/30 text-teal-400 px-2 py-1 rounded border border-teal-500/20">CASE #{c.id.split('-')[0].toUpperCase()}</span>
                                                <span className="text-xs text-gray-500 bg-[#0a0a0a] px-2 py-1 rounded">Transferred from CID</span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2 text-gray-200">{c.classification || 'Pending Trace Evidence'}</h3>
                                            <p className="text-sm text-gray-400 mb-6 bg-[#0a0a0a] p-3 rounded-xl border border-[#262626]">Requires latent print extraction and DNA matching against AFIS.</p>
                                        </div>
                                        <div className="flex space-x-3 mt-auto">
                                            <button className="flex-1 bg-[#262626] hover:bg-[#333] text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors border border-[#333] flex justify-center items-center">
                                                <Fingerprint className="w-4 h-4 mr-2" /> Log Chain-of-Custody
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {cases.length === 0 && (
                                    <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-[#262626] rounded-2xl bg-[#171717]/50">
                                        <Inbox className="w-12 h-12 text-[#14b8a6] opacity-50 mb-4" />
                                        <p className="text-gray-500 text-lg">No new evidence transfers pending.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'workspace' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Microscope className="w-8 h-8 mr-3 text-[#14b8a6]" /> Analysis Workspace
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl relative overflow-hidden min-h-[500px]">
                                {/* Background stylistic element */}
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-6">Algorithm Runner</h3>
                                        <div className="space-y-4">
                                            <div className="bg-[#0a0a0a] border border-[#262626] p-5 rounded-xl">
                                                <p className="text-sm font-semibold text-gray-400 mb-2">Subject Sample</p>
                                                <div className="flex items-center space-x-3 bg-[#171717] p-3 rounded-lg border border-[#333]">
                                                    <Fingerprint className="w-8 h-8 text-teal-500 opacity-80" />
                                                    <div>
                                                        <p className="text-gray-300 font-mono text-xs">EVID-9923-LATENT</p>
                                                        <p className="text-[10px] text-gray-500">Extracted from secondary crime scene</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-[#0a0a0a] border border-[#262626] p-5 rounded-xl">
                                                <p className="text-sm font-semibold text-gray-400 mb-2">Target Database</p>
                                                <select className="w-full bg-[#171717] border border-[#333] text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500">
                                                    <option>National DNA Index System (NDIS)</option>
                                                    <option>AFIS (Latent Prints)</option>
                                                    <option>NIBIN (Ballistics)</option>
                                                </select>
                                            </div>

                                            <button
                                                onClick={runAnalysis}
                                                disabled={isProcessing}
                                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)] disabled:opacity-50 flex justify-center items-center"
                                            >
                                                {isProcessing ? (
                                                    <span className="flex items-center"><SearchCode className="w-5 h-5 mr-2 animate-spin" /> Cross-referencing DBs...</span>
                                                ) : (
                                                    <span className="flex items-center"><Microscope className="w-5 h-5 mr-2" /> Execute Analysis</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-bold text-white mb-6 border-b border-[#262626] pb-2">Diagnostic Output</h3>
                                        <div className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 relative">
                                            {isProcessing && (
                                                <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#0a0a0a]/80 rounded-xl">
                                                    <div className="w-full max-w-xs h-2 bg-[#262626] rounded-full overflow-hidden mb-4">
                                                        <div className="h-full bg-teal-500 w-1/2 animate-[progress_1s_ease-in-out_infinite]" style={{ animation: 'progress 1s ease-in-out infinite alternate' }} />
                                                    </div>
                                                    <p className="text-teal-500 text-sm font-mono animate-pulse">Running heuristic match sequence...</p>
                                                </div>
                                            )}

                                            {!isProcessing && !matchResult && (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                                    <SearchCode className="w-10 h-10 mb-3 opacity-30" />
                                                    <p>Awaiting execution command.</p>
                                                </div>
                                            )}

                                            {!isProcessing && matchResult && (
                                                <div className="h-full flex flex-col animate-in zoom-in-95 duration-300">
                                                    <div className="bg-teal-900/20 border border-teal-500/30 p-4 rounded-lg mb-4 text-center">
                                                        <CheckCircle className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                                                        <p className="text-teal-300 font-bold text-lg">Analysis Complete</p>
                                                    </div>
                                                    <p className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-line">
                                                        {`[SYSLOG] Searching > 1.2M entries...\n[SYSLOG] Potential nodes identified: 4\n[SYSLOG] Narrowing parameters...\n\n>> RESULT:\n${matchResult}`}
                                                    </p>
                                                    <button className="mt-auto bg-[#262626] hover:bg-[#333] text-white py-2 rounded-lg text-sm font-semibold transition-colors border border-[#333]">
                                                        Export Raw Data
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <FileText className="w-8 h-8 mr-3 text-[#14b8a6]" /> Sign & Upload Reports
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl">
                                <p className="text-gray-400 mb-8">Completed laboratory reports must be cryptographically signed by the analyzing officer before they are released to the Detective division for prosecution packaging.</p>

                                <div className="space-y-6 max-w-2xl">
                                    <div className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="block text-sm font-semibold text-gray-400 mb-2">Target Case Directory</label>
                                            <select className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500">
                                                {cases.map((c) => (
                                                    <option key={c.id} value={c.id}>CASE #{c.id.split('-')[0].toUpperCase()} - {c.classification}</option>
                                                ))}
                                                {cases.length === 0 && <option value="">No Active Cases</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-400 mb-2">Attached Asset (PDF/Encrypted Packet)</label>
                                        <div className="border-2 border-dashed border-[#262626] hover:border-teal-500/50 bg-[#0a0a0a] rounded-xl p-8 text-center transition-colors cursor-pointer group">
                                            <UploadCloud className="w-10 h-10 text-gray-500 group-hover:text-teal-500 mx-auto mb-3 transition-colors" />
                                            <p className="text-sm text-gray-400 font-semibold group-hover:text-gray-300">Drag file here or click to browse</p>
                                            <p className="text-xs text-gray-600 mt-1">Accepts strictly .pdf, .docx, .zip</p>
                                        </div>
                                    </div>

                                    <button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)] disabled:opacity-50 flex justify-center items-center mt-4">
                                        <LinkIcon className="w-5 h-5 mr-2" /> Upload & cryptograph
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Needed because lucide-react doesn't have Link string matching cleanly above if not imported
import { Link as LinkIcon } from 'lucide-react';
