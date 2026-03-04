'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import BiometricModal from '../../components/BiometricModal';
import { Search, FolderOpen, LogOut, ShieldCheck, Lock, FileText, Database, FlaskConical, ChevronRight, UploadCloud, Link as LinkIcon, Send } from 'lucide-react';

interface Incident { id: string; description: string; location: string; status: string; createdAt: string; }
interface Case { id: string; classification: string; locked: boolean; incident: Incident; createdAt: string; }
// Mock Evidence and Forensic models for frontend UI
interface Evidence { id: string; type: string; description: string; chainOfCustodyLog: string; }
interface ForensicReport { id: string; findings: string; status: string; }

export default function DetectivePortal() {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'incidents' | 'cases'>('cases');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [caseInnerTab, setCaseInnerTab] = useState<'timeline' | 'evidence' | 'forensic'>('timeline');

    const [showBiometric, setShowBiometric] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: string, payload?: any } | null>(null);

    // Mock states for inside a case
    const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
    const [reports, setReports] = useState<ForensicReport[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'DETECTIVE') {
            router.push('/');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            const [resInc, resCas] = await Promise.all([
                api.get('/incidents'),
                api.get('/cases')
            ]);
            setIncidents(resInc.data);
            setCases(resCas.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEscalateClick = (incidentId: string) => {
        setPendingAction({ type: 'ESCALATE', payload: { incidentId } });
        setShowBiometric(true);
    };

    const handleCaseLockClick = () => {
        setPendingAction({ type: 'LOCK_CASE' });
        setShowBiometric(true);
    };

    const handleBiometricSuccess = async (biometricToken: string) => {
        if (pendingAction?.type === 'ESCALATE') {
            try {
                await api.post('/cases', {
                    incidentId: pendingAction.payload.incidentId,
                    classification: 'Pending Cyber/Physical Review'
                }, {
                    headers: { 'x-biometric-token': biometricToken }
                });
                alert('Case officially created. Evidence registry unlocked.');
                fetchData();
                setActiveTab('cases');
            } catch (err: any) {
                alert('Failed to escalate to case: ' + (err.response?.data?.error || err.message));
            }
        } else if (pendingAction?.type === 'LOCK_CASE' && selectedCase) {
            alert('Investigation Locked. Submitted to Prosecutor.');
            setSelectedCase({ ...selectedCase, locked: true });
            fetchData();
        }
        setPendingAction(null);
    };

    const selectCase = async (c: Case) => {
        setSelectedCase(c);
        setCaseInnerTab('timeline');

        try {
            const [evRes, repRes] = await Promise.all([
                api.get(`/evidence/case/${c.id}`),
                api.get(`/forensics/case/${c.id}`)
            ]);
            setEvidenceList(evRes.data);
            setReports(repRes.data);
        } catch (err) {
            console.error('Failed to load case data', err);
        }
    };

    const handleLogEvidence = async () => {
        if (!selectedCase) return;
        const desc = window.prompt('Enter evidence description:');
        if (!desc) return;
        try {
            await api.post('/evidence', {
                caseId: selectedCase.id,
                description: desc,
                type: 'DOCUMENT',
                fileUrl: 'https://placeholder.com/evidence'
            });
            alert('Evidence securely logged to chain-of-custody.');
            // Refresh
            selectCase(selectedCase);
        } catch (err) { alert('Failed to log evidence.'); }
    };

    const handleRequestAnalysis = async () => {
        if (!selectedCase) return;
        const findings = window.prompt('Enter forensic analysis directions/initial notes:');
        if (!findings) return;
        try {
            await api.post('/forensics', {
                caseId: selectedCase.id,
                findings
            });
            alert('Lab analysis requested from Forensics Unit.');
            selectCase(selectedCase);
        } catch (err) { alert('Failed to request forensics.'); }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            <BiometricModal
                isOpen={showBiometric}
                onClose={() => { setShowBiometric(false); setPendingAction(null); }}
                onSuccess={handleBiometricSuccess}
                title={pendingAction?.type === 'LOCK_CASE' ? "Authorize Case Closure" : "Authorize Case Escalation"}
            />

            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#8b5cf6]">
                        <Search className="w-6 h-6 mr-2" /> CID Unit
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab('cases'); setSelectedCase(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'cases' && !selectedCase ? 'bg-[#262626] text-[#8b5cf6] border-r-2 border-[#8b5cf6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <FolderOpen className="w-5 h-5" />
                        <span>Active Cases</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('incidents'); setSelectedCase(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'incidents' ? 'bg-[#262626] text-[#8b5cf6] border-r-2 border-[#8b5cf6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <ShieldCheck className="w-5 h-5" />
                        <span>Incident Queue</span>
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

                    {activeTab === 'incidents' && !selectedCase && (
                        <section>
                            <h2 className="text-3xl font-bold mb-8 tracking-tight text-white flex items-center border-b border-[#262626] pb-4">
                                <ShieldCheck className="w-8 h-8 mr-3 text-[#8b5cf6]" /> Incident Intake Queue
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626]">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Location</th>
                                            <th className="px-6 py-4">Date Reported</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {incidents.filter(i => i.status === 'UNDER_INVESTIGATION' || i.status === 'SUBMITTED' || i.status === 'RESPONDING').map(inc => (
                                            <tr key={inc.id} className="hover:bg-[#202020] transition-colors">
                                                <td className="px-6 py-4 font-mono text-[#8b5cf6]">{inc.id.split('-')[0]}</td>
                                                <td className="px-6 py-4">{inc.location}</td>
                                                <td className="px-6 py-4">{new Date(inc.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700">{inc.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleEscalateClick(inc.id)}
                                                        className="bg-[#8b5cf6] hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-transform hover:scale-105"
                                                    >
                                                        Adopt Case
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {incidents.filter(i => i.status === 'SUBMITTED' || i.status === 'RESPONDING' || i.status === 'UNDER_INVESTIGATION').length === 0 && (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-500">No unassigned incidents in queue.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'cases' && !selectedCase && (
                        <section>
                            <h2 className="text-3xl font-bold mb-8 tracking-tight text-white flex items-center border-b border-[#262626] pb-4">
                                <FolderOpen className="w-8 h-8 mr-3 text-[#8b5cf6]" /> My Open Investigations
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cases.length === 0 ? (
                                    <div className="col-span-full text-gray-500 py-10 text-center border border-dashed border-[#262626] bg-[#171717] rounded-xl text-lg">
                                        No active case files matching your ID.
                                    </div>
                                ) : (
                                    cases.map(c => (
                                        <div key={c.id} onClick={() => selectCase(c)} className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-xl hover:border-[#8b5cf6]/50 transition-all cursor-pointer group">
                                            <div className="flex justify-between items-center mb-4 border-b border-[#262626] pb-3">
                                                <div className="flex items-center space-x-2">
                                                    <FolderOpen className="w-5 h-5 text-[#8b5cf6]" />
                                                    <span className="text-sm font-mono font-bold text-gray-200">FILE-{c.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                                {c.locked ? (
                                                    <span className="text-xs bg-red-900/30 text-red-500 px-3 py-1 rounded-full flex items-center font-bold border border-red-500/20"><Lock className="w-3 h-3 mr-1" /> CLOSED/LOCKED</span>
                                                ) : (
                                                    <span className="text-xs bg-green-900/30 text-green-500 px-3 py-1 rounded-full font-bold border border-green-500/20">ACTIVE</span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold mb-3 text-purple-100">{c.classification || "Unclassified Investigation"}</h3>
                                            <p className="text-sm text-gray-400 line-clamp-2 mb-6 bg-[#0a0a0a] p-3 rounded border border-[#262626]">
                                                {c.incident?.description}
                                            </p>
                                            <div className="flex justify-end">
                                                <span className="text-sm text-[#8b5cf6] font-semibold flex items-center group-hover:underline">
                                                    Open Workspace <ChevronRight className="w-4 h-4 ml-1" />
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}

                    {selectedCase && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="flex justify-between items-end mb-8 border-b border-[#262626] pb-4">
                                <div>
                                    <button onClick={() => setSelectedCase(null)} className="text-sm text-gray-500 hover:text-white mb-2 flex items-center transition-colors">
                                        <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Cases
                                    </button>
                                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center">
                                        Case File: <span className="ml-3 font-mono text-[#8b5cf6]">{selectedCase.id.split('-')[0].toUpperCase()}</span>
                                        {selectedCase.locked && <Lock className="w-6 h-6 ml-4 text-red-500" />}
                                    </h2>
                                    <p className="text-gray-400 mt-2">{selectedCase.classification}</p>
                                </div>
                                {!selectedCase.locked && (
                                    <button onClick={handleCaseLockClick} className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center">
                                        <Send className="w-4 h-4 mr-2" /> Submit to Prosecutor
                                    </button>
                                )}
                            </div>

                            {/* Inner Navigation */}
                            <div className="flex space-x-2 mb-8 bg-[#171717] p-1.5 rounded-xl border border-[#262626] w-fit">
                                <button
                                    onClick={() => setCaseInnerTab('timeline')}
                                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${caseInnerTab === 'timeline' ? 'bg-[#262626] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Investigation Timeline
                                </button>
                                <button
                                    onClick={() => setCaseInnerTab('evidence')}
                                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${caseInnerTab === 'evidence' ? 'bg-[#262626] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Evidence Registry
                                </button>
                                <button
                                    onClick={() => setCaseInnerTab('forensic')}
                                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${caseInnerTab === 'forensic' ? 'bg-[#262626] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Forensic Sync
                                </button>
                            </div>

                            {/* Inner Content Tabs */}
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl min-h-[500px]">
                                {caseInnerTab === 'timeline' && (
                                    <div className="space-y-8">
                                        <div className="flex items-start">
                                            <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                                <FileText className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">{new Date(selectedCase.incident?.createdAt).toLocaleString()}</p>
                                                <h4 className="text-lg font-bold text-white">Incident Reported</h4>
                                                <p className="text-gray-300 mt-2 bg-[#0a0a0a] p-4 rounded-xl border border-[#262626]">{selectedCase.incident?.description}</p>
                                            </div>
                                        </div>
                                        <div className="w-0.5 h-8 bg-[#262626] ml-5 -my-4"></div>
                                        <div className="flex items-start">
                                            <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                                <Lock className="w-4 h-4 text-[#8b5cf6]" />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">{new Date(selectedCase.createdAt).toLocaleString()}</p>
                                                <h4 className="text-lg font-bold text-purple-400">Escalated to Case Directory</h4>
                                                <p className="text-gray-500 text-sm mt-1">Biometric signature validated by Detective {user.name}.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {caseInnerTab === 'evidence' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold flex items-center"><Database className="w-5 h-5 mr-3 text-[#8b5cf6]" /> Chain-of-Custody Manager</h3>
                                            {!selectedCase.locked && (
                                                <button onClick={handleLogEvidence} className="bg-[#262626] hover:bg-[#333] text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors flex items-center border border-[#333]">
                                                    <UploadCloud className="w-4 h-4 mr-2" /> Log Evidence
                                                </button>
                                            )}
                                        </div>

                                        <table className="w-full text-left text-sm text-gray-400 mt-4 border border-[#262626] rounded-lg overflow-hidden block">
                                            <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626] table w-full table-fixed">
                                                <tr>
                                                    <th className="px-6 py-4 w-1/6">Tag ID</th>
                                                    <th className="px-6 py-4 w-1/6">Type</th>
                                                    <th className="px-6 py-4 w-2/6">Description</th>
                                                    <th className="px-6 py-4 w-2/6">Log Segment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#262626] block max-h-[300px] overflow-y-auto w-full">
                                                {evidenceList.map(e => (
                                                    <tr key={e.id} className="hover:bg-[#202020] transition-colors table w-full table-fixed">
                                                        <td className="px-6 py-4 font-mono text-gray-300">{e.id}</td>
                                                        <td className="px-6 py-4"><span className="bg-gray-800 px-2 py-1 rounded text-xs">{e.type}</span></td>
                                                        <td className="px-6 py-4 text-gray-300">{e.description}</td>
                                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{e.chainOfCustodyLog}</td>
                                                    </tr>
                                                ))}
                                                {evidenceList.length === 0 && (
                                                    <tr className="table w-full"><td colSpan={4} className="text-center py-6">No evidence logged.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {caseInnerTab === 'forensic' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold flex items-center"><FlaskConical className="w-5 h-5 mr-3 text-green-500" /> Lab Requests & Reports</h3>
                                            {!selectedCase.locked && (
                                                <button onClick={handleRequestAnalysis} className="bg-[#262626] hover:bg-[#333] text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors flex items-center border border-[#333]">
                                                    <LinkIcon className="w-4 h-4 mr-2" /> Request Analysis
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {reports.map(r => (
                                                <div key={r.id} className="bg-[#0a0a0a] border border-[#262626] p-5 rounded-xl flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <span className="font-mono text-green-500 font-bold">{r.id}</span>
                                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${r.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-500' : 'bg-green-900/40 text-green-500'}`}>
                                                                {r.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-400 text-sm">{r.findings}</p>
                                                    </div>
                                                    <button className="text-green-500 bg-green-500/10 hover:bg-green-500 hover:text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                                        View Data
                                                    </button>
                                                </div>
                                            ))}
                                            {reports.length === 0 && (
                                                <div className="text-center py-8 text-gray-500 border border-dashed border-[#262626] rounded-xl">No active lab requests.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
