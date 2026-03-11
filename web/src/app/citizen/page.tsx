'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { ShieldAlert, List, LogOut, FileText, Send, Map, UserCircle, MapPin, EyeOff, Locate, Loader2, UploadCloud, Bell } from 'lucide-react';
import DynamicMap from '../../components/DynamicMap';
import ProfilePanel from '../../components/ProfilePanel';
import Modal from '../../components/Modal';

// Generate safe mock coordinates based on incident ID string
const getMockCoordinates = (id: string): [number, number] => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
    return [
        40.7128 + ((hash % 100) / 1000) - 0.05,
        -74.0060 + (((hash >> 2) % 100) / 1000) - 0.05
    ];
};

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

    const [activeTab, setActiveTab] = useState<'report' | 'history' | 'map' | 'profile' | 'cases'>('report');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [desc, setDesc] = useState('');
    const [suspectDetails, setSuspectDetails] = useState('');
    const [mediaAttached, setMediaAttached] = useState(false);
    const [loc, setLoc] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [evidenceType, setEvidenceType] = useState<'PHOTO' | 'VIDEO' | 'AUDIO' | ''>('');
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [cases, setCases] = useState<any[]>([]);
    const [casesLoading, setCasesLoading] = useState(false);
    const [casesError, setCasesError] = useState<string | null>(null);
    const [casesLoaded, setCasesLoaded] = useState(false);
    const [modal, setModal] = useState<{ title: string; message: string } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setModal({ title: 'Location Error', message: 'Geolocation is not supported by your browser.' });
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        setLoc(data.display_name);
                    } else {
                        setLoc(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                    }
                } catch (err) {
                    setLoc(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setModal({ title: 'Location Error', message: 'Unable to retrieve your location. Please check GPS permissions and try again.' });
                setIsLocating(false);
            }
        );
    };

    useEffect(() => {
        if (!user || user.role !== 'CITIZEN') {
            router.push('/');
        }
    }, [user, router]);

    useEffect(() => {
        if (activeTab === 'history' || activeTab === 'map') {
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

    useEffect(() => {
        if (activeTab !== 'cases' || casesLoaded) return;

        const loadCases = async () => {
            setCasesLoading(true);
            setCasesError(null);
            try {
                const res = await api.get('/court/my');
                setCases(res.data);
            } catch (err: any) {
                console.error(err);
                setCasesError(err?.response?.data?.error || 'Failed to load cases');
            } finally {
                setCasesLoading(false);
                setCasesLoaded(true);
            }
        };

        loadCases();
    }, [activeTab, casesLoaded]);

    const handleReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let uploadedEvidenceUrl: string | null = null;

            if (evidenceFile) {
                const formData = new FormData();
                formData.append('file', evidenceFile);
                const uploadRes = await api.post('/uploads', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                uploadedEvidenceUrl = uploadRes.data?.url || null;
            }

            const evidenceLabel = uploadedEvidenceUrl
                ? uploadedEvidenceUrl
                : evidenceType
                    ? `${evidenceType} FILE`
                    : (evidenceFile ? 'FILE' : 'NONE');
            const finalDesc = isAnonymous
                ? `[ANONYMOUS REPORT]\n${desc}\nSuspect Details: ${suspectDetails || 'None provided'}\nEvidence: ${evidenceLabel}`
                : `${desc}\nSuspect Details: ${suspectDetails || 'None provided'}\nEvidence: ${evidenceLabel}`;
            await api.post('/incidents', { description: finalDesc, location: loc });
            setDesc('');
            setSuspectDetails('');
            setMediaAttached(false);
            setLoc('');
            setIsAnonymous(false);
            setEvidenceType('');
            setEvidenceFile(null);
            setModal({ title: 'Incident Submitted', message: 'Your incident has been reported securely to GuardianNet.' });
            setActiveTab('history');
        } catch (err: any) {
            console.error('Citizen incident report failed', err);
            const apiError = err?.response?.data?.error || err?.message || 'Unknown error';
            const apiDetails = err?.response?.data?.details;
            setModal({
                title: 'Failed to Report Incident',
                message: `Error from server: ${apiError}${apiDetails ? ' (' + apiDetails + ')' : ''}`,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || !user) return null;

    return (
        <>
        <div className="flex h-screen bg-dark-main text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-dark-panel border-r border-dark-border flex flex-col">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold flex items-center text-role-citizen">
                        <ShieldAlert className="w-6 h-6 mr-2" /> Citizen Hub
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'report' ? 'bg-dark-border text-role-citizen border-r-2 border-role-citizen' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>Report Incident</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'history' ? 'bg-dark-border text-role-citizen border-r-2 border-role-citizen' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <List className="w-5 h-5" />
                        <span>My Reports</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'map' ? 'bg-dark-border text-role-citizen border-r-2 border-role-citizen' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <Map className="w-5 h-5" />
                        <span>Alerts Map</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'profile' ? 'bg-dark-border text-role-citizen border-r-2 border-role-citizen' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <UserCircle className="w-5 h-5" />
                        <span>Profile & Security</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'cases' ? 'bg-dark-border text-role-citizen border-r-2 border-role-citizen' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>My Cases</span>
                    </button>
                </div>
                <div className="p-4 border-t border-dark-border">
                    <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Secure Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                <div className={`p-10 mx-auto transition-all duration-300 ${activeTab === 'map' ? 'max-w-none w-full h-full flex flex-col' : 'max-w-4xl'}`}>
                    {activeTab === 'report' && (
                        <div className="bg-dark-panel border border-dark-border rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-white border-b border-dark-border pb-4 flex items-center">
                                <FileText className="w-6 h-6 mr-3 text-role-citizen" /> New Incident Report
                            </h2>
                            <form onSubmit={handleReport} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Location / GPS</label>
                                    <div className="relative flex items-center">
                                        <MapPin className="absolute left-4 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text" required value={loc} onChange={e => setLoc(e.target.value)}
                                            placeholder="Nearest address or landmark"
                                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-12 pr-14 py-3 text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            disabled={isLocating}
                                            className="absolute right-3 p-2 bg-[#262626] hover:bg-[#333] rounded-lg text-gray-400 hover:text-[#10b981] transition-colors disabled:opacity-50"
                                            title="Use my current location"
                                        >
                                            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Detailed Description</label>
                                    <textarea
                                        required value={desc} onChange={e => setDesc(e.target.value)} rows={4}
                                        placeholder="Describe what happened..."
                                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Suspect Descriptions (Optional)</label>
                                    <textarea
                                        value={suspectDetails} onChange={e => setSuspectDetails(e.target.value)} rows={2}
                                        placeholder="Height, clothing, distinguishing features, vehicle details..."
                                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-colors"
                                    />
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-semibold text-white flex items-center">
                                                <UploadCloud className="w-4 h-4 mr-2" /> Digital Evidence
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Attach a photo, video, or audio clip from the scene.
                                            </p>
                                        </div>
                                        {(evidenceFile || mediaAttached) && (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-300 font-mono">
                                                FILE READY
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEvidenceType('PHOTO')}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                evidenceType === 'PHOTO'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                                                    : 'bg-[#111827] text-gray-300 border-[#262626]'
                                            }`}
                                        >
                                            Photo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEvidenceType('VIDEO')}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                evidenceType === 'VIDEO'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                                                    : 'bg-[#111827] text-gray-300 border-[#262626]'
                                            }`}
                                        >
                                            Video
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEvidenceType('AUDIO')}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                evidenceType === 'AUDIO'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                                                    : 'bg-[#111827] text-gray-300 border-[#262626]'
                                            }`}
                                        >
                                            Audio
                                        </button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <input
                                            type="file"
                                            accept={
                                                evidenceType === 'PHOTO'
                                                    ? 'image/*;capture=camera'
                                                    : evidenceType === 'VIDEO'
                                                    ? 'video/*;capture=camcorder'
                                                    : evidenceType === 'AUDIO'
                                                    ? 'audio/*;capture=microphone'
                                                    : 'image/*,video/*,audio/*'
                                            }
                                            onChange={(e) => {
                                                const f = e.target.files?.[0] || null;
                                                setEvidenceFile(f);
                                                setMediaAttached(Boolean(f));
                                            }}
                                            className="text-xs text-gray-300"
                                        />
                                        <p className="text-[11px] text-gray-500">
                                            On mobile, this will let you open camera, video, or microphone directly.
                                        </p>
                                    </div>
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
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-sm text-gray-400 font-semibold">Investigation Progress</p>
                                                    <span className="text-xs font-mono text-gray-600 bg-[#171717] px-2 py-1 rounded">LOG: {inc.id.split('-')[1] || '0000'}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-sm">
                                                        <div className={`w-2 h-2 rounded-full mr-2 ${inc.status !== 'SUBMITTED' ? 'bg-[#10b981]' : 'bg-green-500 animate-pulse'}`}></div>
                                                        <span className={inc.status === 'SUBMITTED' ? 'text-white' : 'text-gray-500'}>Initial Assessment / Dispatch</span>
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <div className={`w-2 h-2 rounded-full mr-2 ${inc.status === 'UNDER_INVESTIGATION' ? 'bg-purple-500 animate-pulse' : inc.status === 'CLOSED' ? 'bg-[#10b981]' : 'bg-[#262626]'}`}></div>
                                                        <span className={inc.status === 'UNDER_INVESTIGATION' ? 'text-white' : 'text-gray-500'}>Active Case (Detective Assigned)</span>
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <div className={`w-2 h-2 rounded-full mr-2 ${inc.status === 'CLOSED' ? 'bg-[#10b981]' : 'bg-[#262626]'}`}></div>
                                                        <span className={inc.status === 'CLOSED' ? 'text-white' : 'text-gray-500'}>Resolution / Closed</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-gray-500">
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
                        <div className="flex-1 flex flex-col">
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center shrink-0"><Map className="w-6 h-6 mr-3 text-[#10b981]" /> Community Alerts Map</h2>
                            <div className="flex-1 min-h-[600px]">
                                <DynamicMap
                                    center={[40.7128, -74.0060]}
                                    zoom={12}
                                    markers={incidents.filter(inc => inc.status !== 'CLOSED').map(inc => {
                                        const coords = getMockCoordinates(inc.id);
                                        return {
                                            id: inc.id,
                                            lat: coords[0],
                                            lng: coords[1],
                                            title: `Incident #${inc.id.split('-')[0].toUpperCase()}`,
                                            description: inc.description.substring(0, 100) + '...',
                                            isUrgent: inc.status === 'RESPONDING' || inc.status === 'UNDER_INVESTIGATION'
                                        };
                                    })}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                                <UserCircle className="w-6 h-6 mr-3 text-[#10b981]" /> Profile & Security Settings
                            </h2>
                            <ProfilePanel />

                            <div className="mt-8 bg-[#171717] border border-[#262626] rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-gray-300 border-b border-[#262626] pb-3 mb-4 flex items-center">
                                    <Bell className="w-4 h-4 mr-2" /> Notification Preferences
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300 font-semibold">Emergency SMS Alerts</span>
                                        <input type="checkbox" className="w-4 h-4 accent-[#10b981] bg-[#171717] border-[#262626] rounded focus:ring-[#10b981]" defaultChecked />
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300 font-semibold">Incident Status Updates</span>
                                        <input type="checkbox" className="w-4 h-4 accent-[#10b981] bg-[#171717] border-[#262626] rounded focus:ring-[#10b981]" defaultChecked />
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300 font-semibold">Neighborhood Crime Summaries</span>
                                        <input type="checkbox" className="w-4 h-4 accent-[#10b981] bg-[#171717] border-[#262626] rounded focus:ring-[#10b981]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cases' && (
                        <div className="bg-dark-panel border border-dark-border rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                                <FileText className="w-6 h-6 mr-3 text-role-citizen" /> My Cases &amp; Court Decisions
                            </h2>

                            {casesLoading && (
                                <p className="text-gray-400 text-sm">Loading your cases...</p>
                            )}
                            {casesError && (
                                <p className="text-red-400 text-sm mb-4">{casesError}</p>
                            )}

                            {!casesLoading && cases.length === 0 && !casesError && (
                                <div className="border border-dashed border-dark-border rounded-xl p-6 bg-[#020617] text-center space-y-2">
                                    <p className="text-emerald-400 text-sm font-semibold tracking-wide">
                                        CLEAN RECORD
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        There are currently no court cases associated with your GuardianNet profile.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {cases.map((r: any) => (
                                    <div
                                        key={r.id}
                                        className="bg-[#020617] border border-dark-border rounded-xl p-6 hover:border-role-citizen/60 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-xs font-mono text-gray-500">
                                                    CASE #{(r.id as string).split('-')[0].toUpperCase()}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Incident: {r.case?.incident?.location || 'Unknown location'}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 text-xs font-bold rounded-full ${
                                                    r.verdict === 'GUILTY'
                                                        ? 'bg-red-900/40 text-red-400'
                                                        : r.verdict === 'PENDING'
                                                        ? 'bg-yellow-900/30 text-yellow-400'
                                                        : 'bg-green-900/30 text-green-400'
                                                }`}
                                            >
                                                {r.verdict}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-300 mb-2">
                                            <span className="font-semibold text-gray-400">Charge:</span>{' '}
                                            {r.charge || 'Not specified'}
                                        </p>
                                        <p className="text-sm text-gray-300 whitespace-pre-line">
                                            <span className="font-semibold text-gray-400">Judicial Report:</span>{' '}
                                            {r.sentence || 'No written report recorded yet.'}
                                        </p>

                                        <p className="text-xs text-gray-500 mt-3">
                                            Decision date: {new Date(r.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {modal && (
            <Modal
                open={true}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal(null)}
            />
        )}
        </>
    );
}
