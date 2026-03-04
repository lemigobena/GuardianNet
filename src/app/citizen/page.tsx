'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { ShieldAlert, List, LogOut, FileText, Send, Map, UserCircle, Fingerprint, MapPin, EyeOff } from 'lucide-react';

interface Incident {
    id: string;
    description: string;
    location: string;
    status: string;
    createdAt: string;
    case?: { detective?: { name: string } };
}

export default function CitizenPortal() {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'report' | 'history' | 'map' | 'profile'>('report');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [desc, setDesc] = useState('');
    const [loc, setLoc] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'CITIZEN') {
            router.push('/');
        }
    }, [user, router]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchIncidents();
        }
    }, [activeTab]);

    const fetchIncidents = async () => {
        try {
            // Note: In a real system we would fetch cases joined to incidents to show detective assignment.
            // Since our current incidents endpoint doesn't eager load cases, we might fetch cases separately or just show basic status.
            // For MVP, if backend provides it we use it, otherwise mock.
            const res = await api.get('/incidents');
            setIncidents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Incorporate `isAnonymous` in description or as a future field in schema
            const finalDesc = isAnonymous ? `[ANONYMOUS REPORT] ${desc}` : desc;
            await api.post('/incidents', { description: finalDesc, location: loc });
            setDesc(''); setLoc(''); setIsAnonymous(false);
            alert("Incident reported securely.");
            setActiveTab('history');
        } catch (err) {
            alert("Failed to report.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#10b981]">
                        <ShieldAlert className="w-6 h-6 mr-2" /> Citizen Hub
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'report' ? 'bg-[#262626] text-[#10b981] border-r-2 border-[#10b981]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>Report Incident</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'history' ? 'bg-[#262626] text-[#10b981] border-r-2 border-[#10b981]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <List className="w-5 h-5" />
                        <span>My Reports</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'map' ? 'bg-[#262626] text-[#10b981] border-r-2 border-[#10b981]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Map className="w-5 h-5" />
                        <span>Alerts Map</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'profile' ? 'bg-[#262626] text-[#10b981] border-r-2 border-[#10b981]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <UserCircle className="w-5 h-5" />
                        <span>Profile & Security</span>
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
                <div className="p-10 max-w-4xl mx-auto">
                    {activeTab === 'report' && (
                        <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-white border-b border-[#262626] pb-4 flex items-center">
                                <FileText className="w-6 h-6 mr-3 text-[#10b981]" /> New Incident Report
                            </h2>
                            <form onSubmit={handleReport} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Location / GPS</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text" required value={loc} onChange={e => setLoc(e.target.value)}
                                            placeholder="Nearest address or landmark"
                                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-12 pr-4 py-3 text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Detailed Description</label>
                                    <textarea
                                        required value={desc} onChange={e => setDesc(e.target.value)} rows={5}
                                        placeholder="Describe what happened, suspect details, etc."
                                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex items-center space-x-3 p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="w-5 h-5 accent-[#10b981] bg-[#171717] border-[#262626] rounded focus:ring-[#10b981]"
                                    />
                                    <label htmlFor="anonymous" className="text-sm font-semibold text-gray-400 flex items-center cursor-pointer">
                                        <EyeOff className="w-4 h-4 mr-2" /> Report Anonymously (Identity shielded from field officers)
                                    </label>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button type="submit" disabled={loading} className="bg-[#10b981] hover:bg-emerald-400 text-[#0a0a0a] font-bold px-8 py-3 rounded-xl flex items-center space-x-2 transition-transform transform hover:scale-105 disabled:opacity-50">
                                        <Send className="w-5 h-5" />
                                        <span>Transmit to GuardianNet</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center"><List className="w-6 h-6 mr-3 text-[#10b981]" /> Your Reporting Timeline</h2>
                            <div className="space-y-4">
                                {incidents.length === 0 ? (
                                    <div className="text-gray-500 text-center py-10 border border-dashed border-[#262626] rounded-xl bg-[#171717]">
                                        No incidents reported yet.
                                    </div>
                                ) : (
                                    incidents.map((inc, i) => (
                                        <div key={inc.id} className="bg-[#171717] border border-[#262626] p-6 rounded-xl hover:border-[#10b981]/50 transition-colors relative">
                                            {/* Timeline line connecting items loosely */}
                                            {i !== incidents.length - 1 && <div className="absolute left-10 bottom-[-16px] w-[2px] h-4 bg-[#262626]"></div>}

                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-sm text-gray-400 font-mono">INCIDENT #{inc.id.split('-')[0].toUpperCase()}</span>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${inc.status === 'SUBMITTED' ? 'bg-gray-800 text-gray-300' :
                                                        inc.status === 'UNDER_INVESTIGATION' ? 'bg-purple-900/50 text-purple-400' :
                                                            'bg-[#10b981]/20 text-[#10b981]'
                                                    }`}>
                                                    {inc.status}
                                                </span>
                                            </div>
                                            <p className="text-lg mb-4 text-gray-200">{inc.description}</p>

                                            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#262626] mb-4">
                                                <p className="text-sm text-gray-400 font-semibold mb-1">Status Update</p>
                                                <p className="text-sm text-gray-300">
                                                    {inc.status === 'SUBMITTED' ? 'Awaiting dispatch assignment.' :
                                                        inc.status === 'UNDER_INVESTIGATION' ? 'Escalated to case file. Detective assigned.' :
                                                            'Incident closed or resolved.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center text-sm text-gray-500 space-x-6">
                                                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {inc.location}</span>
                                                <span>{new Date(inc.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'map' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center"><Map className="w-6 h-6 mr-3 text-[#10b981]" /> Community Alerts Map</h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
                                {/* Mock Map Background */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-repeat" />

                                <div className="z-10 text-center">
                                    <ShieldAlert className="w-16 h-16 text-[#10b981] mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-gray-300 mb-2">Map Interface Initializing</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">Real-time geospatial data and non-sensitive neighborhood alerts will be displayed here securely.</p>
                                </div>

                                {/* Mock Map Nodes */}
                                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full" />

                                <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                                <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-[#10b981] rounded-full" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center"><UserCircle className="w-6 h-6 mr-3 text-[#10b981]" /> Profile & Security Settings</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#171717] border border-[#262626] rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-gray-300 border-b border-[#262626] pb-3 mb-4">Account Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Full Name</p>
                                            <p className="font-semibold text-lg">{user.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Registered Email</p>
                                            <p className="font-semibold text-lg">{user.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Clearance Level</p>
                                            <span className="inline-block mt-1 px-3 py-1 bg-[#10b981]/20 text-[#10b981] font-bold text-xs rounded">CITIZEN (TIER 1)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#171717] border border-[#262626] rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-gray-300 border-b border-[#262626] pb-3 mb-4">Biometric Verification</h3>
                                    <div className="flex flex-col items-center justify-center py-4">
                                        {user.biometric_registered ? (
                                            <>
                                                <div className="w-20 h-20 rounded-full bg-[#10b981]/20 flex items-center justify-center mb-4 border border-[#10b981]/50">
                                                    <Fingerprint className="w-10 h-10 text-[#10b981]" />
                                                </div>
                                                <p className="text-[#10b981] font-bold text-lg mb-1">Biometrics Active</p>
                                                <p className="text-gray-500 text-sm text-center">Your fingerprint/FaceID vault is securely linked to this device.</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4 border border-gray-600">
                                                    <Fingerprint className="w-10 h-10 text-gray-500" />
                                                </div>
                                                <p className="text-gray-400 font-bold text-lg mb-1">No Biometrics Linked</p>
                                                <button className="mt-4 bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                                    Setup Hardware Key
                                                </button>
                                            </>
                                        )}
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
