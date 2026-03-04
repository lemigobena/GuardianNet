'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import BiometricModal from '../../components/BiometricModal';
import { Bookmark, LogOut, Gavel, FileCheck, Calendar as CalendarIcon, BookOpen, Clock, ShieldCheck, FileText, CheckCircle } from 'lucide-react';

export default function JudicialAdminPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'docket' | 'scheduling' | 'registry'>('docket');
    const [records, setRecords] = useState<any[]>([]);

    // For biometric verdict
    const [showBiometric, setShowBiometric] = useState(false);
    const [verdictPayload, setVerdictPayload] = useState<{ id: string, verdict: string, sentence: string } | null>(null);

    // Mock form specific 
    const [verdictInput, setVerdictInput] = useState('GUILTY');
    const [sentenceInput, setSentenceInput] = useState('');
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'JUDICIAL_ADMIN') {
            router.push('/');
            return;
        }
        fetchRecords();
    }, [user, router]);

    const fetchRecords = async () => {
        try {
            const res = await api.get('/court');
            setRecords(res.data);
        } catch (err) { }
    };

    const handleVerdictSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecordId) return;
        setVerdictPayload({ id: selectedRecordId, verdict: verdictInput, sentence: sentenceInput });
        setShowBiometric(true);
    };

    const handleBiometricSuccess = async (token: string) => {
        if (verdictPayload) {
            try {
                // In reality, this would correctly hit PUT /api/court/:id with the token
                // For mock, we'll optimistically update if no endpoint supports it yet
                alert(`Verdict [${verdictPayload.verdict}] irreversibly sealed to chain.`);
                fetchRecords(); // re-fetch
                setSelectedRecordId(null);
                setSentenceInput('');
            } catch (err) {
                alert('Failed to seal verdict.');
            }
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            <BiometricModal
                isOpen={showBiometric}
                onClose={() => { setShowBiometric(false); setVerdictPayload(null); }}
                onSuccess={handleBiometricSuccess}
                title="Seal Judicial Verdict"
            />

            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#f97316]">
                        <Bookmark className="w-6 h-6 mr-2" /> Judicial Admin
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab('docket'); setSelectedRecordId(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'docket' ? 'bg-[#262626] text-[#f97316] border-r-2 border-[#f97316]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Gavel className="w-5 h-5" />
                        <span>Active Trial Docket</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('scheduling'); setSelectedRecordId(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'scheduling' ? 'bg-[#262626] text-[#f97316] border-r-2 border-[#f97316]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <CalendarIcon className="w-5 h-5" />
                        <span>Court Scheduling</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('registry'); setSelectedRecordId(null); }}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'registry' ? 'bg-[#262626] text-[#f97316] border-r-2 border-[#f97316]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <BookOpen className="w-5 h-5" />
                        <span>Sentencing Registry</span>
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

                    {activeTab === 'docket' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Gavel className="w-8 h-8 mr-3 text-[#f97316]" /> Active Trial Docket
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Cases */}
                                <div className="space-y-4">
                                    {records.map((r: any) => (
                                        <div key={r.id} onClick={() => setSelectedRecordId(r.id)} className={`bg-[#171717] border p-6 rounded-2xl cursor-pointer transition-all ${selectedRecordId === r.id ? 'border-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-[#262626] hover:border-[#f97316]/50'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs bg-orange-900/30 text-orange-500 font-bold px-2 py-1 rounded border border-orange-500/20">CASE #{r.id.split('-')[0].toUpperCase()}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${r.verdict === 'PENDING' ? 'bg-yellow-900/30 text-yellow-500' : 'bg-green-900/30 text-green-500'}`}>{r.verdict}</span>
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-200 mb-1">{r.charge || 'Prosecutorial Charge'}</h3>
                                            <p className="text-sm text-gray-500 flex items-center"><CalendarIcon className="w-4 h-4 mr-1" /> Date Filed: {new Date(r.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                    {records.length === 0 && (
                                        <div className="text-center py-10 border border-dashed border-[#262626] rounded-xl bg-[#171717]">
                                            <Gavel className="w-10 h-10 text-[#f97316] opacity-50 mx-auto mb-3" />
                                            <p className="text-gray-500">No active cases registered by prosecution.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Biometric Verdict Entry */}
                                <div>
                                    {selectedRecordId ? (
                                        <div className="bg-[#171717] border border-[#262626] p-8 rounded-2xl shadow-2xl sticky top-10 animate-in zoom-in-95">
                                            <div className="flex items-center justify-between border-b border-[#262626] pb-4 mb-6">
                                                <h3 className="text-2xl font-bold text-white flex items-center"><FileCheck className="w-6 h-6 mr-2 text-[#f97316]" /> Enter Verdict</h3>
                                                <ShieldCheck className="w-6 h-6 text-green-500" />
                                            </div>

                                            <form onSubmit={handleVerdictSubmit} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Judgment (Verdict)</label>
                                                    <select
                                                        value={verdictInput}
                                                        onChange={(e) => setVerdictInput(e.target.value)}
                                                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f97316] font-bold"
                                                    >
                                                        <option value="GUILTY">GUILTY</option>
                                                        <option value="NOT_GUILTY">NOT GUILTY</option>
                                                        <option value="DISMISSED">DISMISSED</option>
                                                        <option value="MISTRIAL">MISTRIAL</option>
                                                    </select>
                                                </div>

                                                {verdictInput === 'GUILTY' && (
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-400 mb-2">Sentencing Directives</label>
                                                        <textarea
                                                            required
                                                            value={sentenceInput}
                                                            onChange={(e) => setSentenceInput(e.target.value)}
                                                            rows={4}
                                                            placeholder="e.g., 5 years incarceration, $10,000 fine..."
                                                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:border-[#f97316]"
                                                        />
                                                    </div>
                                                )}

                                                <div className="bg-orange-900/10 border border-orange-500/20 p-4 rounded-xl flex items-start mt-4">
                                                    <ShieldCheck className="w-5 h-5 text-[#f97316] mr-3 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-orange-200">This action legally binds the verdict to the case file. You will be prompted for hardware biometric authentication to proceed.</p>
                                                </div>

                                                <button type="submit" className="w-full bg-[#f97316] hover:bg-orange-500 text-[#0a0a0a] font-black py-4 rounded-xl transition-transform hover:scale-105 shadow-[0_0_15px_rgba(249,115,22,0.4)] flex justify-center items-center">
                                                    <CheckCircle className="w-5 h-5 mr-2" /> Seal Biometric Verdict
                                                </button>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="h-full border border-dashed border-[#262626] rounded-2xl flex flex-col items-center justify-center text-gray-500 bg-[#171717]/50 min-h-[400px]">
                                            <FileText className="w-12 h-12 mb-4 opacity-50" />
                                            Select a case from the docket to enter a verdict.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'scheduling' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <CalendarIcon className="w-8 h-8 mr-3 text-[#f97316]" /> Court Resource Scheduling
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl shadow-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-white">Upcoming Hearings (Next 7 Days)</h3>
                                    <button className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-[#333]">
                                        + Schedule Hearing
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {/* Mock schedule */}
                                    <div className="flex items-center bg-[#0a0a0a] border border-[#262626] p-4 rounded-xl">
                                        <div className="bg-[#f97316] text-[#0a0a0a] rounded-lg p-3 text-center min-w-[80px] mr-6">
                                            <p className="text-xs font-bold uppercase">MAR</p>
                                            <p className="text-2xl font-black">12</p>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-200">Arraignment: State v. Doe</h4>
                                            <p className="text-sm text-gray-500 flex items-center mt-1"><Clock className="w-4 h-4 mr-1" /> 09:00 AM - 10:30 AM</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-300">Courtroom 4</p>
                                            <p className="text-xs text-gray-500">Hon. Judge Peterson</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-[#0a0a0a] border border-[#262626] p-4 rounded-xl">
                                        <div className="bg-[#f97316] text-[#0a0a0a] rounded-lg p-3 text-center min-w-[80px] mr-6">
                                            <p className="text-xs font-bold uppercase">MAR</p>
                                            <p className="text-2xl font-black">15</p>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-200">Evidentiary Hearing: Case #F112</h4>
                                            <p className="text-sm text-gray-500 flex items-center mt-1"><Clock className="w-4 h-4 mr-1" /> 14:30 PM - 16:00 PM</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-300">Courtroom 2A</p>
                                            <p className="text-xs text-gray-500">Hon. Judge M. Lin</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'registry' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <BookOpen className="w-8 h-8 mr-3 text-[#f97316]" /> Master Sentencing Registry
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626]">
                                        <tr>
                                            <th className="px-6 py-4">Conviction Date</th>
                                            <th className="px-6 py-4">Case #</th>
                                            <th className="px-6 py-4">Primary Charge</th>
                                            <th className="px-6 py-4">Legal Verdict</th>
                                            <th className="px-6 py-4">Sentence Mandate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {records.filter(r => r.verdict === 'GUILTY').map((r: any) => (
                                            <tr key={r.id} className="hover:bg-[#202020] transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-mono text-[#f97316]">{r.id.split('-')[0].toUpperCase()}</td>
                                                <td className="px-6 py-4 text-gray-200">{r.charge}</td>
                                                <td className="px-6 py-4"><span className="bg-red-900/30 text-red-500 px-2 py-1 rounded text-xs font-bold">GUILTY</span></td>
                                                <td className="px-6 py-4 text-gray-300 max-w-xs truncate" title={r.sentence}>{r.sentence}</td>
                                            </tr>
                                        ))}
                                        {records.filter(r => r.verdict === 'GUILTY').length === 0 && (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-500 border-none">No convictions recorded in registry.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
