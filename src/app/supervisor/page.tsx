'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { Activity, Users, FileText, AlertTriangle, LogOut, Map, ShieldAlert, Target, Shield, Eye, BarChart2 } from 'lucide-react';

interface Incident { id: string; description: string; location: string; status: string; createdAt: string; }
interface Case { id: string; classification: string; status: string; detectiveId: string | null; incident: Incident; createdAt: string; }

export default function SupervisorPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'analytics' | 'assignment' | 'monitoring' | 'audits'>('analytics');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [cases, setCases] = useState<Case[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'SUPERVISOR') {
            router.push('/');
            return;
        }
        fetchStats();
    }, [user, router]);

    const fetchStats = async () => {
        try {
            const [resInc, resCas] = await Promise.all([
                api.get('/incidents'),
                api.get('/cases')
            ]);
            setIncidents(resInc.data);
            setCases(resCas.data);
        } catch (err) { }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#ef4444]">
                        <Activity className="w-6 h-6 mr-2" /> Supervisor
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'analytics' ? 'bg-[#262626] text-[#ef4444] border-r-2 border-[#ef4444]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Map className="w-5 h-5" />
                        <span>City Analytics</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('assignment')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'assignment' ? 'bg-[#262626] text-[#ef4444] border-r-2 border-[#ef4444]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Target className="w-5 h-5" />
                        <span>Case Assignment</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('monitoring')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'monitoring' ? 'bg-[#262626] text-[#ef4444] border-r-2 border-[#ef4444]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span>Officer Monitoring</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('audits')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'audits' ? 'bg-[#262626] text-[#ef4444] border-r-2 border-[#ef4444]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <ShieldAlert className="w-5 h-5" />
                        <span>Internal Audit Flags</span>
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

                    {activeTab === 'analytics' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <BarChart2 className="w-8 h-8 mr-3 text-[#ef4444]" /> Strategic City Analytics
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Active Incidents</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">{incidents.length}</p>
                                    <p className="text-xs text-red-500 mt-2">Requires Response</p>
                                </div>
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">CID Cases</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">{cases.length}</p>
                                    <p className="text-xs text-purple-400 mt-2">Under Investigation</p>
                                </div>
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Clearance Rate</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">42.8%</p>
                                    <p className="text-xs text-blue-400 mt-2">Monthly Average</p>
                                </div>
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Active Units</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">14</p>
                                    <p className="text-xs text-orange-400 mt-2">Deployable Officers</p>
                                </div>
                            </div>

                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-6 shadow-2xl relative min-h-[400px] flex flex-col items-center justify-center">
                                {/* Mock Heatmap */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-repeat" />
                                <div className="z-10 text-center">
                                    <Map className="w-16 h-16 text-[#ef4444] mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-gray-300 mb-2">Live Deployment Heatmap</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">Visualizing high-crime sectors and active Patrol Officer GPS locations.</p>
                                </div>
                                {/* Nodes */}
                                <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_blue]" />
                                <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_blue]" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignment' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Target className="w-8 h-8 mr-3 text-[#ef4444]" /> Detective Case Assignment
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626]">
                                        <tr>
                                            <th className="px-6 py-4">Case ID</th>
                                            <th className="px-6 py-4">Classification</th>
                                            <th className="px-6 py-4">Current Detective</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Reassign</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {cases.map((c: Case) => (
                                            <tr key={c.id} className="hover:bg-[#202020] transition-colors">
                                                <td className="px-6 py-4 font-mono text-purple-400">{c.id.split('-')[0]}</td>
                                                <td className="px-6 py-4 text-gray-200">{c.classification || 'Unclassified'}</td>
                                                <td className="px-6 py-4">
                                                    {c.detectiveId ? <span className="text-gray-300">Det. Assigned</span> : <span className="text-red-500 font-bold">UNASSIGNED</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs border ${c.status === 'OPEN' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-[#333]">
                                                        Assign CID
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cases.length === 0 && (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-500">No active cases require assignment.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'monitoring' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Users className="w-8 h-8 mr-3 text-[#ef4444]" /> Subordinate Officer Monitoring
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mock Officer Roster */}
                                {[
                                    { name: 'Officer J. Miller', role: 'PATROL', status: 'ON_DUTY', response: '3m 42s', handled: 42 },
                                    { name: 'Det. Sarah Vance', role: 'DETECTIVE', status: 'INVESTIGATING', response: 'N/A', handled: 14 },
                                    { name: 'Officer D. Reed', role: 'PATROL', status: 'OFF_DUTY', response: '5m 10s', handled: 28 },
                                    { name: 'Officer K. Chen', role: 'PATROL', status: 'ON_DUTY', response: '4m 05s', handled: 51 }
                                ].map((officer, idx) => (
                                    <div key={idx} className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg flex flex-col hover:border-[#ef4444]/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4 border-b border-[#262626] pb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{officer.name}</h3>
                                                <p className="text-xs text-gray-500 mt-1">{officer.role} DIVISION</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${officer.status === 'ON_DUTY' || officer.status === 'INVESTIGATING' ? 'bg-green-900/30 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                                                {officer.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#262626]">
                                                <p className="text-xs text-gray-500 mb-1">Avg Response</p>
                                                <p className="text-lg font-mono text-gray-200">{officer.response}</p>
                                            </div>
                                            <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#262626]">
                                                <p className="text-xs text-gray-500 mb-1">Incidents Handled</p>
                                                <p className="text-lg font-mono text-gray-200">{officer.handled}</p>
                                            </div>
                                        </div>
                                        <button className="mt-4 w-full bg-[#262626] hover:bg-[#333] text-gray-300 py-2 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center">
                                            <FileText className="w-4 h-4 mr-2" /> View Full Activity Log
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'audits' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <ShieldAlert className="w-8 h-8 mr-3 text-[#ef4444]" /> Internal Audit Flags
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626]">
                                        <tr>
                                            <th className="px-6 py-4">Timestamp</th>
                                            <th className="px-6 py-4">Personnel Role</th>
                                            <th className="px-6 py-4">Action Flagged</th>
                                            <th className="px-6 py-4">Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {/* Mock Audit Flags for Supervisor */}
                                        <tr className="hover:bg-[#202020] transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-500">2026-03-04 14:32</td>
                                            <td className="px-6 py-4"><span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs">PATROL_OFFICER</span></td>
                                            <td className="px-6 py-4 text-gray-300">Rejected dispatch 3 times in one shift.</td>
                                            <td className="px-6 py-4"><span className="text-yellow-500 font-bold text-xs"><AlertTriangle className="w-4 h-4 inline mr-1" /> WARNING</span></td>
                                        </tr>
                                        <tr className="hover:bg-[#202020] transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-500">2026-03-04 11:15</td>
                                            <td className="px-6 py-4"><span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded text-xs">DETECTIVE</span></td>
                                            <td className="px-6 py-4 text-gray-300">Biometric override failed twice before case creation.</td>
                                            <td className="px-6 py-4"><span className="text-red-500 font-bold text-xs"><AlertTriangle className="w-4 h-4 inline mr-1" /> CRITICAL</span></td>
                                        </tr>
                                        <tr className="hover:bg-[#202020] transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-500">2026-03-03 09:44</td>
                                            <td className="px-6 py-4"><span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs">UNKNOWN</span></td>
                                            <td className="px-6 py-4 text-gray-300">Unauthorized access attempt to Case Workspace.</td>
                                            <td className="px-6 py-4"><span className="text-red-500 font-bold text-xs"><Shield className="w-4 h-4 inline mr-1" /> BREACH</span></td>
                                        </tr>
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
