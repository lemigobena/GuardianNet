'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { ShieldAlert, LogOut, Users, Settings, Activity, Search, Shield, UserX, UserCheck, ToggleRight, Server } from 'lucide-react';

export default function AdminPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'personnel' | 'audit' | 'config'>('personnel');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'SYSTEM_ADMIN') {
            router.push('/');
            return;
        }
        if (activeTab === 'audit') {
            fetchAudits();
        }
    }, [user, router, activeTab]);

    const fetchAudits = async () => {
        try {
            const res = await api.get('/audits'); // Existing audit endpoint
            setAuditLogs(res.data || []);
        } catch (err) {
            console.error("Failed to fetch audits", err);
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#64748b]">
                        <ShieldAlert className="w-6 h-6 mr-2" /> SysAdmin Node
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{user.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('personnel')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'personnel' ? 'bg-[#262626] text-[#64748b] border-r-2 border-[#64748b]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span>Personnel Management</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'audit' ? 'bg-[#262626] text-[#64748b] border-r-2 border-[#64748b]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Activity className="w-5 h-5" />
                        <span>Global Audit Viewer</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'config' ? 'bg-[#262626] text-[#64748b] border-r-2 border-[#64748b]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <Settings className="w-5 h-5" />
                        <span>System Configuration</span>
                    </button>
                </div>
                <div className="p-4 border-t border-[#262626]">
                    <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                <div className="p-10 max-w-6xl mx-auto">

                    {activeTab === 'personnel' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Users className="w-8 h-8 mr-3 text-[#64748b]" /> Personnel & Clearance Verification
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl shadow-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-300">Distributed Role Registry</h3>
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                                        <input type="text" placeholder="Search accounts..." className="bg-[#0a0a0a] border border-[#333] pl-9 pr-4 py-1.5 rounded-lg text-sm focus:outline-none focus:border-[#64748b]" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {/* Mock Personnel List spanning different tables */}
                                    {[
                                        { id: 'usr_patrol_1x', name: 'Officer D. Reed', role: 'PATROL_OFFICER', verified: true, active: true },
                                        { id: 'usr_det_9a', name: 'Det. Sarah Vance', role: 'DETECTIVE', verified: true, active: true },
                                        { id: 'usr_jud_4b', name: 'Hon. M. Lin', role: 'JUDICIAL_ADMIN', verified: true, active: true },
                                        { id: 'usr_cit_pending', name: 'Mike Ross', role: 'CITIZEN', verified: false, active: true },
                                        { id: 'usr_for_2x', name: 'Dr. A. Gupta', role: 'FORENSIC_OFFICER', verified: true, active: false } // Suspended
                                    ].map((p, idx) => (
                                        <div key={idx} className={`bg-[#0a0a0a] border p-4 rounded-xl flex items-center justify-between transition-colors ${p.active ? 'border-[#262626] hover:border-[#64748b]/50' : 'border-red-900/50 opacity-70'}`}>
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <h4 className="text-md font-bold text-gray-200">{p.name}</h4>
                                                    <span className="text-xs font-mono text-gray-500">{p.id}</span>
                                                    {!p.active && <span className="text-xs bg-red-900/40 text-red-500 font-bold px-2 py-0.5 rounded">SUSPENDED</span>}
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="bg-slate-900/40 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">{p.role}</span>
                                                    {p.verified ? (
                                                        <span className="text-xs text-green-500 flex items-center"><Shield className="w-3 h-3 mr-1" /> Cleared</span>
                                                    ) : (
                                                        <span className="text-xs text-yellow-500 flex items-center">Pending Verification</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {!p.verified && (
                                                    <button className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors">
                                                        <UserCheck className="w-4 h-4 mr-1" /> Approve
                                                    </button>
                                                )}
                                                {p.active ? (
                                                    <button className="bg-[#262626] hover:bg-red-500/20 hover:text-red-500 text-gray-400 border border-[#333] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors">
                                                        <UserX className="w-4 h-4 mr-1" /> Suspend
                                                    </button>
                                                ) : (
                                                    <button className="bg-[#262626] hover:bg-green-500/20 hover:text-green-500 text-gray-400 border border-[#333] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors">
                                                        <UserCheck className="w-4 h-4 mr-1" /> Reinstate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Activity className="w-8 h-8 mr-3 text-[#64748b]" /> Global System Audit Logs
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626]">
                                        <tr>
                                            <th className="px-6 py-4">Timestamp</th>
                                            <th className="px-6 py-4">Actor ID</th>
                                            <th className="px-6 py-4">Actor Role</th>
                                            <th className="px-6 py-4">Action Logged</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {auditLogs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-[#202020] transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-300">{log.userId}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-slate-900/50 text-slate-400 px-2 py-1 flex w-fit rounded border border-slate-700 text-[10px] uppercase font-bold text-center">
                                                        {log.userRole}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">{log.action}</td>
                                            </tr>
                                        ))}
                                        {auditLogs.length === 0 && (
                                            <tr><td colSpan={4} className="text-center py-10 text-gray-500 border-none">No system audits recorded or database offline.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <Settings className="w-8 h-8 mr-3 text-[#64748b]" /> System Configuration
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#171717] border border-[#262626] p-8 rounded-2xl shadow-xl">
                                    <h3 className="text-lg font-bold text-white flex items-center mb-6"><ShieldAlert className="w-5 h-5 mr-2 text-slate-400" /> Security Parameters</h3>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-300">Strict Bio-Verifications</p>
                                                <p className="text-xs text-gray-500">Require hardware token for sensitive writes.</p>
                                            </div>
                                            <ToggleRight className="w-10 h-10 text-green-500 cursor-pointer" />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-300">Public Anonymous Reporting</p>
                                                <p className="text-xs text-gray-500">Allow Citizens to strip identifiers from tips.</p>
                                            </div>
                                            <ToggleRight className="w-10 h-10 text-green-500 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#171717] border border-[#262626] p-8 rounded-2xl shadow-xl">
                                    <h3 className="text-lg font-bold text-white flex items-center mb-6"><Server className="w-5 h-5 mr-2 text-slate-400" /> Infrastructure Status</h3>

                                    <div className="space-y-4">
                                        <div className="bg-[#0a0a0a] border border-[#262626] p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-300 text-sm">PostgreSQL (Neon DB)</p>
                                                <p className="text-xs text-gray-500 font-mono">us-east-1a</p>
                                            </div>
                                            <span className="flex items-center text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" /> ONLINE
                                            </span>
                                        </div>
                                        <div className="bg-[#0a0a0a] border border-[#262626] p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-300 text-sm">Next.js Edge Runtime</p>
                                                <p className="text-xs text-gray-500 font-mono">Vercel V8</p>
                                            </div>
                                            <span className="flex items-center text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" /> ONLINE
                                            </span>
                                        </div>
                                    </div>

                                    <button className="w-full mt-6 bg-[#262626] hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-600 block text-center">
                                        Restart Application Nodes
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
