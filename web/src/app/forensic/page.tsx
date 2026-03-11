'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { FlaskConical, LogOut, UploadCloud, Microscope, Inbox, Fingerprint, FileText, CheckCircle, SearchCode, Link as LinkIcon, AlertTriangle, Activity, UserCircle } from 'lucide-react';
import ProfilePanel from '../../components/ProfilePanel';

interface Case { id: string; classification: string; status: string; incident: any; createdAt: string; }

export default function ForensicPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'intake' | 'workspace' | 'reports' | 'profile'>('intake');
    const [cases, setCases] = useState<Case[]>([]);
    const [pendingReports, setPendingReports] = useState<any[]>([]);
    const [completedReports, setCompletedReports] = useState<any[]>([]);
    const [selectedReportCase, setSelectedReportCase] = useState('');
    const [reportFindings, setReportFindings] = useState('');
    const [evidenceUsed, setEvidenceUsed] = useState('');
    const [reportFile, setReportFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'FORENSIC_OFFICER') {
            router.push('/');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            const [casesRes, reportsRes] = await Promise.all([
                api.get('/cases'),
                api.get('/forensics')
            ]);
            setCases(casesRes.data);
            // Forensic officers only see reports that have been assigned to them
            setPendingReports(reportsRes.data.filter((r: any) => r.status === 'PENDING'));
            setCompletedReports(reportsRes.data.filter((r: any) => r.status === 'COMPLETED'));
        } catch (err) { }
    };

    const handleLogCustody = async (caseId: string) => {
        const desc = window.prompt('Enter evidence description for chain-of-custody log:');
        if (!desc) return;
        try {
            await api.post('/evidence', {
                caseId,
                description: desc,
                type: 'FORENSIC_SAMPLE',
                fileUrl: 'https://placeholder.com/forensic-evidence'
            });
            alert('Evidence logged to chain-of-custody successfully.');
        } catch (err) { alert('Failed to log evidence.'); }
    };

    const handleSubmitReport = async () => {
        if (!selectedReportCase || !reportFindings.trim() || !evidenceUsed.trim()) {
            alert('Please select a case, document the evidence analyzed, and enter your findings.');
            return;
        }
        try {
            let attachmentUrl: string | null = null;

            if (reportFile) {
                const formData = new FormData();
                formData.append('file', reportFile);
                const uploadRes = await api.post('/uploads', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                attachmentUrl = uploadRes.data?.url || null;
            }

            await api.post('/forensics', {
                caseId: selectedReportCase,
                findings: reportFindings,
                evidenceUsed: evidenceUsed,
                type: 'LAB_ANALYSIS'
            });

            if (attachmentUrl) {
                await api.post('/evidence', {
                    caseId: selectedReportCase,
                    description: reportFile?.name || 'Forensic report attachment',
                    type: 'FORENSIC_REPORT',
                    fileUrl: attachmentUrl,
                });
            }

            alert('Forensic report cryptographically signed and uploaded.');
            setReportFindings('');
            setEvidenceUsed('');
            setReportFile(null);
            fetchData();
        } catch (err) { alert('Failed to submit report.'); }
    };

    // Reserved for future automated analysis tooling.
    const runAnalysis = () => { };

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
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'profile' ? 'bg-[#262626] text-[#14b8a6] border-r-2 border-[#14b8a6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
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
            <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                <div className="p-10 max-w-6xl mx-auto">

                    {activeTab === 'intake' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Inbox className="w-8 h-8 mr-3 text-[#14b8a6]" /> Physical & Digital Intake
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cases.filter(c => !completedReports.some(r => r.caseId === c.id)).map((c: Case) => (
                                    <div key={c.id} className="bg-[#171717] border border-[#262626] p-6 rounded-2xl flex flex-col justify-between shadow-lg hover:border-[#14b8a6]/50 transition-colors group">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex space-x-2">
                                                    <span className="text-xs font-mono bg-teal-900/30 text-teal-400 px-2 py-1 rounded border border-teal-500/20">CASE #{c.id.split('-')[0].toUpperCase()}</span>
                                                    {cases.indexOf(c) === 0 && (
                                                        <span className="text-xs bg-red-900/30 text-red-500 px-2 py-1 rounded-full flex items-center font-bold border border-red-500/20 animate-pulse"><AlertTriangle className="w-3 h-3 mr-1" /> URGENT</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 bg-[#0a0a0a] px-2 py-1 rounded">Transferred from CID</span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2 text-gray-200">{c.classification || 'Pending Trace Evidence'}</h3>
                                            <p className="text-sm text-gray-400 mb-6 bg-[#0a0a0a] p-3 rounded-xl border border-[#262626]">Requires latent print extraction and DNA matching against AFIS.</p>

                                        </div>
                                    </div>
                                ))}
                                {cases.filter(c => !completedReports.some(r => r.caseId === c.id)).length === 0 && (
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
                            {completedReports.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {completedReports.map((r: any) => (
                                        <div key={r.id} className="bg-[#171717] border border-[#262626] p-6 rounded-2xl flex flex-col shadow-lg">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-xs font-mono bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-500/20">CASE #{r.caseId.split('-')[0].toUpperCase()}</span>
                                                <span className="text-xs bg-green-900/30 text-green-500 px-2 py-1 rounded-full flex items-center font-bold border border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> COMPLETED</span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2 text-gray-200">Lab Analysis Report</h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Evidence Analyzed</p>
                                                <p className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded-xl border border-[#262626]">{r.resultSummary || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Findings</p>
                                                <p className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded-xl border border-[#262626] min-h-[6rem]">{r.findings}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl min-h-[300px] flex items-center justify-center">
                                    <p className="text-gray-400 max-w-2xl text-center text-sm">
                                        When a forensic report is created for a case, the detailed laboratory findings and attached
                                        evidence will be available here. Use the &quot;Evidence Intake&quot; and &quot;Sign &amp; Upload&quot;
                                        sections to work with real case data.
                                    </p>
                                </div>
                            )}
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
                                            <label className="block text-sm font-semibold text-gray-400 mb-2">Target Assigned Case</label>
                                            <select
                                                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                                                value={selectedReportCase}
                                                onChange={(e) => setSelectedReportCase(e.target.value)}
                                            >
                                                <option value="" disabled>Select an assigned case...</option>
                                                {pendingReports.map((r: any) => (
                                                    <option key={r.id} value={r.caseId}>CASE #{r.caseId.split('-')[0].toUpperCase()} - {r.case?.classification || 'Assigned Evaluation'}</option>
                                                ))}
                                                {pendingReports.length === 0 && <option value="">No Pending Assignments</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-400 mb-2">Evidence Analyzed</label>
                                        <textarea
                                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 min-h-[80px] mb-4"
                                            placeholder="Describe what was used as evidence (e.g., DNA Swab 402, Latent Prints)..."
                                            value={evidenceUsed}
                                            onChange={(e) => setEvidenceUsed(e.target.value)}
                                        />
                                        <label className="block text-sm font-semibold text-gray-400 mb-2">Analysis Findings</label>
                                        <textarea
                                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 min-h-[120px]"
                                            placeholder="Enter detailed forensic analysis findings..."
                                            value={reportFindings}
                                            onChange={(e) => setReportFindings(e.target.value)}
                                        />
                                        <label className="block text-sm font-semibold text-gray-400 mb-2">Attached Asset (PDF/Encrypted Packet)</label>
                                        <div
                                            className="border-2 border-dashed border-[#262626] hover:border-teal-500/50 bg-[#0a0a0a] rounded-xl p-8 text-center transition-colors cursor-pointer group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <UploadCloud className="w-10 h-10 text-gray-500 group-hover:text-teal-500 mx-auto mb-3 transition-colors" />
                                            <p className="text-sm text-gray-400 font-semibold group-hover:text-gray-300">Drag file here or click to browse</p>
                                            <p className="text-xs text-gray-600 mt-1">Accepts strictly .pdf, .docx, .zip</p>
                                            {reportFile && (
                                                <p className="text-xs text-teal-400 mt-3">
                                                    Selected: {reportFile.name}
                                                </p>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.doc,.docx,.zip"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] || null;
                                                    setReportFile(f);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <button onClick={handleSubmitReport} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)] disabled:opacity-50 flex justify-center items-center mt-4">
                                        <LinkIcon className="w-5 h-5 mr-2" /> Submit findings to Case Directory
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <UserCircle className="w-8 h-8 mr-3 text-[#14b8a6]" /> Profile & Security
                            </h2>
                            <ProfilePanel />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
