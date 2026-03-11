'use client';


import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { ShieldAlert, LogOut, Users, Settings, Activity, Search, Shield, UserX, UserCheck, ToggleRight, Server, MapPin, Download } from 'lucide-react';
import jsPDF from 'jspdf';


export default function AdminPortal() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'personnel' | 'audit' | 'config'>('personnel');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);

    const [newRegName, setNewRegName] = useState('');
    const [newRegEmail, setNewRegEmail] = useState('');
    const [newRegPhone, setNewRegPhone] = useState('');
    const [newRegDepartment, setNewRegDepartment] = useState('');
    const [newRegAddress, setNewRegAddress] = useState('');
    const [newRegDOB, setNewRegDOB] = useState('');
    const [creatingReg, setCreatingReg] = useState(false);
    const [regModal, setRegModal] = useState<{id: string, tempPassword: string, name: string, email: string, phone: string} | null>(null);
    const [mounted, setMounted] = useState(false);

    // Move fetchAudits and fetchUsers above useEffect
    const fetchAudits = async () => {
        try {
            const res = await api.get('/audits');
            setAuditLogs(res.data || []);
        } catch (err) {
            console.error("Failed to fetch audits", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsersList(res.data || []);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    useEffect(() => {
        setMounted(true);
        if (!user || user.role !== 'SYSTEM_ADMIN') {
            router.push('/');
            return;
        }
        if (activeTab === 'audit') {
            fetchAudits();
        } else if (activeTab === 'personnel') {
            fetchUsers();
        }
    }, [user, router, activeTab]);

    if (!mounted) return null;

    // (Removed duplicate fetchAudits and fetchUsers definitions)

    const handleUpdateUserStatus = async (id: string, role: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
        try {
            await api.put('/admin/users', { id, role, status: newStatus });
            fetchUsers();
            if (activeTab === 'audit') fetchAudits();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleCreateRegistrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingReg(true);
        try {
            const res = await api.post('/admin/registrars', {
                name: newRegName,
                email: newRegEmail,
                phone: newRegPhone,
                department: newRegDepartment,
                address: newRegAddress,
                dateOfBirth: newRegDOB,
            });
            const { id, tempPassword } = res.data;
            setRegModal({ id, tempPassword, name: newRegName, email: newRegEmail, phone: newRegPhone });
            setNewRegName('');
            setNewRegEmail('');
            setNewRegPhone('');
            setNewRegDepartment('');
            setNewRegAddress('');
            setNewRegDOB('');
            fetchUsers();
            if (activeTab === 'audit') fetchAudits();
        } catch (err) {
            alert('Failed to create registrar.');
        } finally {
            setCreatingReg(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!regModal) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Registrar Account Details', 20, 20);
        doc.setFontSize(12);
        doc.text(`Name: ${regModal.name}`, 20, 40);
        doc.text(`Email: ${regModal.email}`, 20, 50);
        doc.text(`Phone: ${regModal.phone}`, 20, 60);
        doc.text(`Registrar ID: ${regModal.id}`, 20, 70);
        doc.text(`Temporary Password: ${regModal.tempPassword}`, 20, 80);
        doc.text('Please change your password after first login.', 20, 100);
        doc.save(`registrar_${regModal.id}.pdf`);
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
                                
                                {/* Create Registrar Form */}
                                <div className="mb-6 bg-[#0a0a0a] border border-[#333] p-4 rounded-xl">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center">
                                        <UserCheck className="w-4 h-4 mr-2 text-green-500" /> Provision New Registrar Node
                                    </h4>
                                    <form onSubmit={handleCreateRegistrar} className="flex flex-col gap-3">
                                        <input type="text" value={newRegName} onChange={e => setNewRegName(e.target.value)} placeholder="Full Name" required className="bg-[#171717] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748b] focus:outline-none" />
                                        <input type="email" value={newRegEmail} onChange={e => setNewRegEmail(e.target.value)} placeholder="Email Address" required className="bg-[#171717] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748b] focus:outline-none" />
                                        <input type="text" value={newRegPhone} onChange={e => setNewRegPhone(e.target.value)} placeholder="Phone Number" required className="bg-[#171717] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748b] focus:outline-none" />
                                        <input type="text" value={newRegDepartment} onChange={e => setNewRegDepartment(e.target.value)} placeholder="Department" className="bg-[#171717] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748b] focus:outline-none" />
                                        <input type="text" value={newRegAddress} onChange={e => setNewRegAddress(e.target.value)} placeholder="Address" className="bg-[#171717] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748b] focus:outline-none" />
                                        <input type="date" value={newRegDOB} onChange={e => setNewRegDOB(e.target.value)} placeholder="Date of Birth" className="bg-[#171717] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748b] focus:outline-none" />
                                        <button type="submit" disabled={creatingReg} className="bg-[#64748b] hover:bg-slate-400 text-[#0a0a0a] font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors shrink-0">
                                            {creatingReg ? 'Provisioning...' : 'Create Registrar'}
                                        </button>
                                    </form>
                                    {/* Modal for showing registrar credentials */}
                                    {regModal && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                                            <div className="bg-[#171717] border border-[#333] rounded-xl p-8 max-w-md w-full relative">
                                                <h3 className="text-lg font-bold text-gray-200 mb-4">Registrar Created</h3>
                                                <div className="mb-2 text-gray-300"><b>Name:</b> {regModal.name}</div>
                                                <div className="mb-2 text-gray-300"><b>Email:</b> {regModal.email}</div>
                                                <div className="mb-2 text-gray-300"><b>Phone:</b> {regModal.phone}</div>
                                                <div className="mb-2 text-gray-300"><b>Registrar ID:</b> <span className="font-mono text-green-400">{regModal.id}</span></div>
                                                <div className="mb-4 text-gray-300"><b>Temporary Password:</b> <span className="font-mono text-yellow-400">{regModal.tempPassword}</span></div>
                                                <div className="flex space-x-2">
                                                    <button onClick={handleDownloadPDF} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded flex items-center"><Download className="w-4 h-4 mr-2" /> Download PDF</button>
                                                    <button onClick={() => setRegModal(null)} className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded">Close</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Mock Personnel List spanning different tables */}
                                    {usersList.map((p, idx) => (
                                        <div key={idx} className={`bg-[#0a0a0a] border p-4 rounded-xl flex items-center justify-between transition-colors ${p.status === 'ACTIVE' ? 'border-[#262626] hover:border-[#64748b]/50' : 'border-red-900/50 opacity-70'}`}>
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <h4 className="text-md font-bold text-gray-200">{p.name || p.email.split('@')[0]}</h4>
                                                    <span className="text-xs font-mono text-gray-500">{p.id.substring(0, 8)}...</span>
                                                    {p.status === 'SUSPENDED' && <span className="text-xs bg-red-900/40 text-red-500 font-bold px-2 py-0.5 rounded">SUSPENDED</span>}
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="bg-slate-900/40 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">{p.role}</span>
                                                    {p.status === 'ACTIVE' || p.status === 'SUSPENDED' ? (
                                                        <span className="text-xs text-green-500 flex items-center"><Shield className="w-3 h-3 mr-1" /> Cleared</span>
                                                    ) : (
                                                        <span className="text-xs text-yellow-500 flex items-center">Pending Verification</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {p.status === 'PENDING' && (
                                                    <button onClick={() => handleUpdateUserStatus(p.id, p.role, 'ACTIVE')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors">
                                                        <UserCheck className="w-4 h-4 mr-1" /> Approve
                                                    </button>
                                                )}
                                                {p.status === 'ACTIVE' ? (
                                                    <button onClick={() => handleUpdateUserStatus(p.id, p.role, 'SUSPENDED')} className="bg-[#262626] hover:bg-red-500/20 hover:text-red-500 text-gray-400 border border-[#333] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors">
                                                        <UserX className="w-4 h-4 mr-1" /> Suspend
                                                    </button>
                                                ) : p.status === 'SUSPENDED' ? (
                                                    <button onClick={() => handleUpdateUserStatus(p.id, p.role, 'ACTIVE')} className="bg-[#262626] hover:bg-green-500/20 hover:text-green-500 text-gray-400 border border-[#333] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors">
                                                        <UserCheck className="w-4 h-4 mr-1" /> Reinstate
                                                    </button>
                                                ) : null}
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
                                            <button onClick={() => alert('Mock: Security parameter modified.')}><ToggleRight className="w-10 h-10 text-green-500 cursor-pointer hover:text-green-400" /></button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-300">Public Anonymous Reporting</p>
                                                <p className="text-xs text-gray-500">Allow Citizens to strip identifiers from tips.</p>
                                            </div>
                                            <button onClick={() => alert('Mock: Security parameter modified.')}><ToggleRight className="w-10 h-10 text-green-500 cursor-pointer hover:text-green-400" /></button>
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

                                    <button onClick={() => alert('Mock: Restart command sent to cluster orchestrator.')} className="w-full mt-6 bg-[#262626] hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-600 block text-center">
                                        Restart Application Nodes
                                    </button>
                                </div>

                                {/* Jurisdiction Settings */}
                                <div className="bg-[#171717] border border-[#262626] p-8 rounded-2xl shadow-xl lg:col-span-2">
                                    <h3 className="text-lg font-bold text-white flex items-center mb-6"><MapPin className="w-5 h-5 mr-2 text-slate-400" /> Jurisdiction & Regional Settings</h3>

                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl">
                                            <div className="mb-4 md:mb-0">
                                                <p className="font-semibold text-gray-300">Active Judicial Districts</p>
                                                <p className="text-xs text-gray-500">Select regions currently routing cases to this server instance.</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <span className="bg-green-900/40 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold">District 1</span>
                                                <span className="bg-green-900/40 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold">District 2</span>
                                                <button onClick={() => alert('Mock: Opening District Manager')} className="bg-[#262626] text-gray-400 hover:text-white border border-[#333] px-3 py-1 rounded-full text-xs font-bold transition-colors">+ Add</button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-300">Cross-Jurisdiction Data Sharing</p>
                                                <p className="text-xs text-gray-500">Automatically share suspect registries with neighboring districts.</p>
                                            </div>
                                            <button onClick={() => alert('Mock: Data sharing parameters updated.')}><ToggleRight className="w-10 h-10 text-green-500 cursor-pointer hover:text-green-400" /></button>
                                        </div>
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
