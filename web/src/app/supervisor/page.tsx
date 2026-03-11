'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { Activity, Users, FileText, AlertTriangle, LogOut, Map, ShieldAlert, Target, Shield, Eye, BarChart2, CheckCircle, TrendingUp, UserX, UserCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import ProfilePanel from '../../components/ProfilePanel';

interface Incident { id: string; description: string; location: string; status: string; createdAt: string; }
interface Case { id: string; classification: string; status: string; detectiveId: string | null; incident: Incident; createdAt: string; }

export default function SupervisorPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'analytics' | 'assignment' | 'monitoring' | 'audits' | 'profile'>('analytics');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [forensicReports, setForensicReports] = useState<any[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'SUPERVISOR') {
            router.push('/');
            return;
        }
        fetchStats();
    }, [user, router]);

    const fetchStats = async () => {
        try {
            const [resInc, resCas, resAudit, resForensics] = await Promise.all([
                api.get('/incidents'),
                api.get('/cases'),
                api.get('/audits'),
                api.get('/forensics')
            ]);
            setIncidents(resInc.data);
            setCases(resCas.data);
            setAuditLogs(resAudit.data);
            setForensicReports(resForensics.data);
        } catch (err) { }
    };

    const handleAssignCase = async (caseId: string) => {
        const detId = window.prompt(`Assign Case #${caseId.split('-')[0].toUpperCase()} to Detective ID:`);
        if (detId) {
            try {
                await api.put(`/cases/${caseId}/assign`, { detectiveId: detId });
                alert(`Case assigned to Detective ${detId} successfully.`);
                fetchStats();
            } catch (err) {
                alert('Mock: Failed to assign case (Endpoint might not exist yet, but UI is wired).');
            }
        }
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
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'profile' ? 'bg-[#262626] text-[#ef4444] border-r-2 border-[#ef4444]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
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

                    {activeTab === 'analytics' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <BarChart2 className="w-8 h-8 mr-3 text-[#ef4444]" /> Strategic City Analytics
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Active Incidents</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">{incidents.length}</p>
                                    <p className="text-xs text-red-500 mt-2">Currently in the system</p>
                                </div>
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">CID Cases</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">{cases.length}</p>
                                    <p className="text-xs text-purple-400 mt-2">Open case files</p>
                                </div>
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Unassigned Cases</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">{cases.filter(c => !c.detectiveId).length}</p>
                                    <p className="text-xs text-yellow-500 mt-2">Awaiting CID Assignment</p>
                                </div>
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Pending Lab Reviews</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white">{forensicReports.filter(r => r.status === 'PENDING_ASSIGNMENT').length}</p>
                                    <p className="text-xs text-blue-400 mt-2">Forensics queue</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl">
                                    <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-[#ef4444]" /> Active Incidents vs Open Cases
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Incidents', count: incidents.length, fill: '#ef4444' },
                                                { name: 'Cases', count: cases.length, fill: '#a855f7' }
                                            ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                                <XAxis dataKey="name" stroke="#525252" tick={{ fill: '#a3a3a3' }} />
                                                <YAxis stroke="#525252" tick={{ fill: '#a3a3a3' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', color: '#fff', borderRadius: '0.5rem' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    cursor={{ fill: '#262626' }}
                                                />
                                                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-xl">
                                    <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center">
                                        <ShieldAlert className="w-5 h-5 mr-2 text-yellow-500" /> Audit Log Activity (Last 20)
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { 
                                                    name: 'Verifications', 
                                                    standard: auditLogs.slice(0, 20).filter(l => !l.biometricVerified).length, 
                                                    biometric: auditLogs.slice(0, 20).filter(l => l.biometricVerified).length 
                                                }
                                            ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                                <XAxis dataKey="name" stroke="#525252" tick={{ fill: '#a3a3a3' }} />
                                                <YAxis stroke="#525252" tick={{ fill: '#a3a3a3' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', color: '#fff', borderRadius: '0.5rem' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    cursor={{ fill: '#262626' }}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                                <Bar dataKey="standard" name="Standard Auth" stackId="a" fill="#eab308" radius={[0, 0, 4, 4]} maxBarSize={60} />
                                                <Bar dataKey="biometric" name="Biometric Auth" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-bold mb-8 flex items-center border-b border-[#262626] pb-4">
                                <UserCircle className="w-8 h-8 mr-3 text-[#ef4444]" /> Profile & Security
                            </h2>
                            <ProfilePanel />
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
                                                    <button onClick={() => handleAssignCase(c.id)} className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-[#333]">
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

                            <h2 className="text-2xl font-bold mt-12 mb-6 flex items-center border-b border-[#262626] pb-3">
                                <Shield className="w-6 h-6 mr-2 text-[#ef4444]" /> Forensic Assignment Queue
                            </h2>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626]">
                                        <tr>
                                            <th className="px-6 py-4">Report ID</th>
                                            <th className="px-6 py-4">Case ID</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Requested By</th>
                                            <th className="px-6 py-4 text-right">Assign Forensic Officer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {forensicReports.filter((r: any) => r.status === 'PENDING_ASSIGNMENT').map((r: any) => (
                                            <tr key={r.id} className="hover:bg-[#202020] transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-300">{r.id.split('-')[0]}</td>
                                                <td className="px-6 py-4 font-mono text-purple-300">{r.caseId.split('-')[0]}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs border border-yellow-500/30">PENDING ASSIGNMENT</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-400">
                                                    {/* We log requester only in audits; for now show placeholder */}
                                                    DETECTIVE (see audit log)
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={async () => {
                                                            const officerId = window.prompt('Assign to Forensic Officer ID:');
                                                            if (!officerId) return;
                                                            try {
                                                                await api.put(`/forensics/${r.id}/assign`, { officerId });
                                                                alert(`Forensic request assigned to officer ${officerId}.`);
                                                                fetchStats();
                                                            } catch {
                                                                alert('Failed to assign forensic officer.');
                                                            }
                                                        }}
                                                        className="inline-flex items-center bg-[#262626] hover:bg-[#333] text-gray-200 px-4 py-2 rounded-lg text-xs font-semibold border border-[#333] transition-colors"
                                                    >
                                                        <Shield className="w-3 h-3 mr-2" /> Assign
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {forensicReports.filter((r: any) => r.status === 'PENDING_ASSIGNMENT').length === 0 && (
                                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No forensic requests awaiting assignment.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <h3 className="text-xl font-bold mt-10 mb-4 flex items-center border-b border-[#262626] pb-2">
                                <Shield className="w-5 h-5 mr-2 text-[#ef4444]" /> Active Forensic Assignments
                            </h3>
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#0a0a0a] text-xs uppercase border-b border-[#262626]">
                                        <tr>
                                            <th className="px-6 py-4">Report ID</th>
                                            <th className="px-6 py-4">Case ID</th>
                                            <th className="px-6 py-4">Assigned Officer</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {forensicReports
                                            .filter((r: any) => r.status !== 'PENDING_ASSIGNMENT')
                                            .map((r: any) => (
                                                <tr key={r.id} className="hover:bg-[#202020] transition-colors">
                                                    <td className="px-6 py-4 font-mono text-gray-300">{r.id.split('-')[0]}</td>
                                                    <td className="px-6 py-4 font-mono text-purple-300">{r.caseId.split('-')[0]}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-300">
                                                        {r.officerId ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-900/20 text-green-400 border border-green-500/30">
                                                                {r.officerId}
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-500 font-bold text-xs">UNASSIGNED</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 rounded text-xs border border-blue-500/30 text-blue-400 bg-blue-500/10">
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        {forensicReports.filter((r: any) => r.status !== 'PENDING_ASSIGNMENT').length === 0 && (
                                            <tr><td colSpan={4} className="text-center py-8 text-gray-500">No active forensic assignments.</td></tr>
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
                            <div className="bg-[#171717] border border-[#262626] rounded-2xl p-8 shadow-2xl text-center text-gray-400">
                                Live per-officer performance telemetry will appear here once connected to your real deployment data.
                                For now, use the analytics, assignment, and audits tabs above to manage cases based on actual incidents and logs.
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
                                        {auditLogs.slice(0, 20).map((log: any) => (
                                            <tr key={log.id} className="hover:bg-[#202020] transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-4"><span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded text-xs">{log.userRole}</span></td>
                                                <td className="px-6 py-4 text-gray-300">{log.action}: {log.details || ''}</td>
                                                <td className="px-6 py-4">
                                                    {log.biometricVerified
                                                        ? <span className="text-green-500 font-bold text-xs"><CheckCircle className="w-4 h-4 inline mr-1" /> VERIFIED</span>
                                                        : <span className="text-yellow-500 font-bold text-xs"><AlertTriangle className="w-4 h-4 inline mr-1" /> STANDARD</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                        {auditLogs.length === 0 && (
                                            <tr><td colSpan={4} className="text-center py-10 text-gray-500">No audit logs recorded.</td></tr>
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
