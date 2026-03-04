'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { Shield, List, LogOut, MapPin, Clock, Search, AlertTriangle, FileText, CheckCircle, BarChart, UploadCloud, ChevronRight, XCircle } from 'lucide-react';

interface Incident {
    id: string;
    description: string;
    location: string;
    status: string;
    createdAt: string;
}

export default function PatrolPortal() {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'alerts' | 'workspace' | 'history' | 'metrics'>('alerts');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [fieldNotes, setFieldNotes] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'PATROL_OFFICER') {
            router.push('/');
            return;
        }
        fetchIncidents();
    }, [user, router]);

    const fetchIncidents = async () => {
        try {
            const res = await api.get('/incidents');
            setIncidents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRespond = (inc: Incident) => {
        // Optimistically update status locally or hit an endpoint to accept dispatch
        setSelectedIncident(inc);
        setActiveTab('workspace');
    };

    const handleEscalate = async () => {
        if (!selectedIncident) return;
        try {
            // Mocking escalation: in reality this calls POST /api/cases
            await api.post('/cases', {
                incidentId: selectedIncident.id,
                classification: 'FIELD_ESCALATION'
            });
            alert("Incident escalated to Detective Division securely.");
            fetchIncidents();
            setActiveTab('alerts');
            setSelectedIncident(null);
        } catch (err) {
            alert("Failed to escalate. Biometric clearance may be required.");
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#171717] border-r border-[#262626] flex flex-col">
                <div className="p-6 border-b border-[#262626]">
                    <h2 className="text-xl font-bold flex items-center text-[#3b82f6]">
                        <Shield className="w-6 h-6 mr-2" /> Patrol Unit
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'alerts' ? 'bg-[#262626] text-[#3b82f6] border-r-2 border-[#3b82f6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <AlertTriangle className="w-5 h-5" />
                        <span>Incoming Alerts</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'workspace' ? 'bg-[#262626] text-[#3b82f6] border-r-2 border-[#3b82f6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>Incident Workspace</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'history' ? 'bg-[#262626] text-[#3b82f6] border-r-2 border-[#3b82f6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <List className="w-5 h-5" />
                        <span>Case Log</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('metrics')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'metrics' ? 'bg-[#262626] text-[#3b82f6] border-r-2 border-[#3b82f6]' : 'text-gray-400 hover:text-white hover:bg-[#262626]/50'}`}
                    >
                        <BarChart className="w-5 h-5" />
                        <span>Metrics</span>
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
                <div className="p-10 max-w-5xl mx-auto">

                    {activeTab === 'alerts' && (
                        <div>
                            <div className="flex justify-between items-center mb-8 border-b border-[#262626] pb-4">
                                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center"><AlertTriangle className="w-8 h-8 mr-3 text-[#3b82f6]" /> Active Dispatch</h2>
                                <div className="flex space-x-2">
                                    <span className="bg-blue-900/40 text-[#3b82f6] px-4 py-1.5 rounded-full text-sm font-semibold flex items-center shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                        <div className="w-2 h-2 rounded-full bg-[#3b82f6] mr-2 animate-pulse" /> Live Monitoring
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {incidents.filter(i => i.status === 'SUBMITTED').length === 0 ? (
                                    <div className="col-span-full text-gray-500 text-center py-10 border border-[#262626] rounded-xl bg-[#171717]">
                                        No active unassigned incidents in your sector.
                                    </div>
                                ) : (
                                    incidents.filter(i => i.status === 'SUBMITTED').map(inc => (
                                        <div key={inc.id} className="bg-[#171717] border border-[#262626] p-6 rounded-2xl shadow-lg flex flex-col hover:border-[#3b82f6]/50 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs text-[#3b82f6] font-mono bg-[#3b82f6]/10 px-2 py-1 rounded">URGENT</span>
                                                <span className="text-sm text-gray-400 flex items-center"><Clock className="w-4 h-4 mr-1" /> {new Date(inc.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-3 flex-1">{inc.description}</h3>
                                            <div className="flex items-center text-sm text-gray-300 mb-6 bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg">
                                                <MapPin className="w-5 h-5 mr-3 text-red-500" /> {inc.location}
                                            </div>

                                            <div className="flex space-x-3 mt-auto border-t border-[#262626] pt-4">
                                                <button onClick={() => handleRespond(inc)} className="flex-1 bg-[#3b82f6] hover:bg-blue-500 text-[#0a0a0a] font-bold py-2.5 rounded-lg transition-transform hover:scale-105 flex justify-center items-center">
                                                    <CheckCircle className="w-5 h-5 mr-2" /> Accept
                                                </button>
                                                <button className="px-4 py-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'workspace' && (
                        <div>
                            <div className="flex justify-between items-center mb-8 border-b border-[#262626] pb-4">
                                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center"><FileText className="w-8 h-8 mr-3 text-[#3b82f6]" /> Incident Workspace</h2>
                            </div>

                            {!selectedIncident ? (
                                <div className="text-gray-500 text-center py-16 border border-dashed border-[#262626] rounded-xl bg-[#171717] flex flex-col items-center">
                                    <List className="w-12 h-12 mb-4 opacity-50 text-[#3b82f6]" />
                                    No incident actively selected. Go to Alerts to accept a dispatch.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl">
                                            <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Incident Details</h3>
                                            <p className="text-gray-100 text-lg mb-4">{selectedIncident.description}</p>
                                            <div className="flex items-center text-gray-400">
                                                <MapPin className="w-5 h-5 mr-2 text-red-500" /> {selectedIncident.location}
                                            </div>
                                        </div>

                                        <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl">
                                            <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Field Notes</h3>
                                            <textarea
                                                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-colors"
                                                rows={5}
                                                placeholder="Enter observations, witness statements, etc."
                                                value={fieldNotes}
                                                onChange={(e) => setFieldNotes(e.target.value)}
                                            />
                                            <button className="mt-4 bg-[#262626] hover:bg-[#333] text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center">
                                                <UploadCloud className="w-4 h-4 mr-2" /> Upload Field Evidence
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl">
                                            <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Actions</h3>
                                            <div className="space-y-3">
                                                <button className="w-full bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/30 px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center">
                                                    Mark as Resolved
                                                </button>
                                                <button onClick={handleEscalate} className="w-full bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/30 px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center justify-center">
                                                    Escalate to Detective
                                                </button>
                                                <button onClick={() => setSelectedIncident(null)} className="w-full bg-[#262626] text-gray-400 hover:text-white px-4 py-3 rounded-xl font-semibold transition-colors">
                                                    Release / Go Back
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <div className="flex justify-between items-center mb-8 border-b border-[#262626] pb-4">
                                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center"><List className="w-8 h-8 mr-3 text-[#3b82f6]" /> Case Log History</h2>
                                <div className="relative">
                                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" />
                                    <input type="text" placeholder="Search handled logs..." className="bg-[#171717] border border-[#262626] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#3b82f6]" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {incidents.filter(i => i.status !== 'SUBMITTED').map(inc => (
                                    <div key={inc.id} className="bg-[#171717] border border-[#262626] p-5 rounded-xl flex items-center justify-between hover:bg-[#262626]/50 transition-colors cursor-pointer group">
                                        <div>
                                            <p className="font-semibold text-gray-200">{inc.description.substring(0, 60)}...</p>
                                            <p className="text-sm text-gray-500 mt-1">{new Date(inc.createdAt).toLocaleDateString()} • {inc.location}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${inc.status === 'UNDER_INVESTIGATION' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-400'
                                                }`}>
                                                {inc.status}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#3b82f6] transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'metrics' && (
                        <div>
                            <div className="flex justify-between items-center mb-8 border-b border-[#262626] pb-4">
                                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center"><BarChart className="w-8 h-8 mr-3 text-[#3b82f6]" /> Performance Metrics</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <p className="text-gray-400 font-semibold mb-2">Average Response Time</p>
                                    <h3 className="text-4xl font-black text-[#3b82f6]">4m 12s</h3>
                                    <p className="text-sm text-green-500 mt-2">▼ 15% from last week</p>
                                </div>
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <p className="text-gray-400 font-semibold mb-2">Incidents Handled</p>
                                    <h3 className="text-4xl font-black text-white">{incidents.length * 3}</h3>
                                    <p className="text-sm text-gray-500 mt-2">This month</p>
                                </div>
                                <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <p className="text-gray-400 font-semibold mb-2">Escalation Rate</p>
                                    <h3 className="text-4xl font-black text-purple-500">24%</h3>
                                    <p className="text-sm text-gray-500 mt-2">To Detective Division</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
