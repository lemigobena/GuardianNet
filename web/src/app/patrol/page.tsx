'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import { Shield, List, LogOut, MapPin, Clock, Search, AlertTriangle, FileText, CheckCircle, BarChart, UploadCloud, ChevronRight, XCircle, Camera, Map, UserCircle } from 'lucide-react';
import DynamicMap from '../../components/DynamicMap';
import ProfilePanel from '../../components/ProfilePanel';

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
}

export default function PatrolPortal() {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'alerts' | 'map' | 'workspace' | 'history' | 'metrics' | 'profile'>('alerts');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [fieldNotes, setFieldNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const [liveLocation, setLiveLocation] = useState<[number, number] | null>(null);
    const [modal, setModal] = useState<{ title: string; message: string } | null>(null);

    const withToken = (path: string) => {
        if (typeof window === 'undefined') return path;
        const token = localStorage.getItem('guardian_token');
        if (!token) return path;
        const sep = path.includes('?') ? '&' : '?';
        return `${path}${sep}token=${encodeURIComponent(token)}`;
    };

    useEffect(() => {
        setMounted(true);

        let geoId: number;
        if ('geolocation' in navigator) {
            geoId = navigator.geolocation.watchPosition(
                (position) => {
                    setLiveLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn("Geolocation error while tracking patrol:", (error && (error as GeolocationPositionError).message) || error);
                    // Fallback to initial mock location if denied or failed
                    setLiveLocation([40.7100, -74.0100]);
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        } else {
            setLiveLocation([40.7100, -74.0100]);
        }

        return () => {
            if (geoId) navigator.geolocation.clearWatch(geoId);
        }
    }, []);

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

    const handleRespond = async (inc: Incident) => {
        // Enforce: only one active incident at a time per patrol unit.
        if (selectedIncident && selectedIncident.status !== 'CLOSED') {
            setModal({
                title: 'Active Incident In Progress',
                message: 'You already have an active incident in your workspace. Resolve or escalate it before accepting a new dispatch.',
            });
            return;
        }

        try {
            await api.put(withToken(`/incidents/${inc.id}`), { status: 'RESPONDING' });
            const updated = { ...inc, status: 'RESPONDING' };
            setSelectedIncident(updated);
            // Immediately switch to the map so the officer sees the optimal route
            setActiveTab('map');
            fetchIncidents();
        } catch (err: any) {
            console.error('Failed to accept dispatch', err);
            const apiError = err?.response?.data?.error || err?.message || 'Unknown error';
            const apiDetails = err?.response?.data?.details;
            setModal({
                title: 'Failed to Accept Dispatch',
                message: `Error from server: ${apiError}${apiDetails ? ' (' + apiDetails + ')' : ''}`,
            });
        }
    };

    const handleResolve = async () => {
        if (!selectedIncident) return;
        try {
            await api.put(withToken(`/incidents/${selectedIncident.id}`), { status: 'CLOSED', descriptionUpdate: fieldNotes });
            setModal({ title: 'Incident Resolved', message: 'Incident marked as resolved.' });
            fetchIncidents();
            setActiveTab('alerts');
            setSelectedIncident(null);
            setFieldNotes('');
        } catch (err) {
            alert("Failed to resolve incident.");
        }
    };

    const handleUpdateNotes = async () => {
        if (!selectedIncident || !fieldNotes.trim()) return;
        try {
            await api.put(withToken(`/incidents/${selectedIncident.id}`), { descriptionUpdate: fieldNotes });
            setModal({ title: 'Notes Saved', message: 'Field notes appended to incident file securely.' });
            setFieldNotes('');
            fetchIncidents(); // refreshing will pull down the new appended notes
        } catch (err) {
            setModal({ title: 'Failed to Update Notes', message: 'Could not append notes to the incident file.' });
        }
    };

    // Evidence upload state
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEvidenceFile(e.target.files[0]);
        }
    };

    // Upload evidence to backend (once a Case has been opened for this incident)
    const handleUploadEvidence = async () => {
        if (!selectedIncident || !evidenceFile) return;
        setUploading(true);
        try {
            // 1) Find or create a Case for this incident.
            //    If no Case exists yet, create a lightweight FIELD_EVIDENCE case owned by patrol.
            const casesRes = await api.get(withToken('/cases'));
            const cases = casesRes.data as any[];
            let targetCase = cases.find((c) => c.incidentId === selectedIncident.id);

            if (!targetCase) {
                const createRes = await api.post(withToken('/cases'), {
                    incidentId: selectedIncident.id,
                    classification: 'FIELD_EVIDENCE',
                });
                targetCase = createRes.data;
            }

            // 2) Upload file to the uploads API to obtain a stable URL
            const formData = new FormData();
            formData.append('file', evidenceFile);
            const uploadRes = await api.post(withToken('/uploads'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const fileUrl: string | undefined = uploadRes.data?.url;

            await api.post('/evidence', {
                caseId: targetCase.id,
                description: evidenceFile.name,
                type: evidenceFile.type.startsWith('image')
                    ? 'IMAGE'
                    : evidenceFile.type.startsWith('video')
                    ? 'VIDEO'
                    : evidenceFile.type.startsWith('audio')
                    ? 'AUDIO'
                    : 'DOCUMENT',
                fileUrl: fileUrl || '',
            });

            setModal({ title: 'Evidence Uploaded', message: 'Evidence uploaded and attached to the active Case file.' });
            setEvidenceFile(null);
        } catch (err: any) {
            console.error('Failed to upload evidence', err);
            const backendMessage = err?.response?.data?.error || err?.message || 'Unknown error';
            setModal({
                title: 'Failed to Upload Evidence',
                message: `Error from server: ${backendMessage}`,
            });
        }
        setUploading(false);
    };

    const citizenMeta = React.useMemo(() => {
        if (!selectedIncident) return null;
        const lines = selectedIncident.description.split('\n');
        const evidence = lines.find((l) => l.toLowerCase().startsWith('evidence:'));
        const suspects = lines.find((l) => l.toLowerCase().startsWith('suspect details:'));
        const core = lines.filter((l) => l !== evidence && l !== suspects).join('\n');
        return { coreDescription: core, evidenceLine: evidence, suspectLine: suspects };
    }, [selectedIncident]);

    // Camera/Audio recording logic
    const startRecording = async (type: 'audio' | 'video') => {
        setRecordingType(type);
        try {
            const stream = await navigator.mediaDevices.getUserMedia(type === 'audio' ? { audio: true } : { video: true, audio: true });
            setMediaStream(stream);
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setRecordedChunks([]);
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
            };
            recorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: type === 'audio' ? 'audio/webm' : 'video/webm' });
                setEvidenceFile(new File([blob], type + '-recording.webm', { type: blob.type }));
                stream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
                setMediaRecorder(null);
                setRecordingType(null);
            };
            recorder.start();
        } catch (err) {
            setModal({
                title: 'Camera / Microphone Error',
                message: 'Could not access media devices. Please check browser permissions and try again.',
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!selectedIncident) return;
        try {
            await api.put(withToken(`/incidents/${selectedIncident.id}`), { status: newStatus });
            setSelectedIncident({ ...selectedIncident, status: newStatus });
            setModal({
                title: 'Status Updated',
                message: `Incident status securely updated to: ${newStatus}`,
            });
            fetchIncidents();
        } catch (err) {
            setModal({ title: 'Failed to Update Status', message: 'Could not update incident status.' });
        }
    };

    const handleEscalate = async () => {
        if (!selectedIncident) return;
        try {
            await api.post('/cases', {
                incidentId: selectedIncident.id,
                classification: 'FIELD_ESCALATION'
            });
            setModal({
                title: 'Incident Escalated',
                message: 'Incident escalated to Detective Division securely.',
            });
            fetchIncidents();
            setActiveTab('alerts');
            setSelectedIncident(null);
        } catch (err) {
            setModal({
                title: 'Failed to Escalate',
                message: 'Could not escalate the incident. Biometric clearance may be required or the server may be unavailable.',
            });
        }
    };

    if (!mounted || !user) return null;

    return (
        <>
        <div className="flex h-screen bg-dark-main text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-dark-panel border-r border-dark-border flex flex-col">
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold flex items-center text-role-patrol">
                        <Shield className="w-6 h-6 mr-2" /> Patrol Unit
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                </div>
                <div className="flex-1 py-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'alerts' ? 'bg-dark-border text-role-patrol border-r-2 border-role-patrol' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <AlertTriangle className="w-5 h-5" />
                        <span>Incoming Alerts</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'map' ? 'bg-dark-border text-role-patrol border-r-2 border-role-patrol' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <Map className="w-5 h-5" />
                        <span>Sector Map</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'workspace' ? 'bg-dark-border text-role-patrol border-r-2 border-role-patrol' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>Incident Workspace</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'history' ? 'bg-dark-border text-role-patrol border-r-2 border-role-patrol' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <List className="w-5 h-5" />
                        <span>Case Log</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('metrics')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'metrics' ? 'bg-dark-border text-role-patrol border-r-2 border-role-patrol' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <BarChart className="w-5 h-5" />
                        <span>Metrics</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${activeTab === 'profile' ? 'bg-dark-border text-role-patrol border-r-2 border-role-patrol' : 'text-gray-400 hover:text-white hover:bg-dark-border/50'}`}
                    >
                        <UserCircle className="w-5 h-5" />
                        <span>Profile</span>
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
            <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5 relative">
                <div className={`p-10 mx-auto transition-all duration-300 ${activeTab === 'map' ? 'max-w-none w-full h-full flex flex-col' : 'max-w-5xl'}`}>

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
                                                <button onClick={() => alert('Dispatch rejected. Re-routing to nearest available unit.')} className="px-4 py-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Reject Dispatch">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'map' && (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-6 border-b border-[#262626] pb-4 shrink-0">
                                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center"><Map className="w-8 h-8 mr-3 text-[#3b82f6]" /> Sector Dispatch Map</h2>
                                <span className="bg-[#3b82f6]/10 text-[#3b82f6] px-4 py-1.5 rounded-full text-sm font-semibold flex items-center border border-[#3b82f6]/30">
                                    <div className="w-2 h-2 rounded-full bg-[#3b82f6] mr-2 animate-pulse" /> Active Monitoring
                                </span>
                            </div>
                            <div className="flex-1 min-h-[600px] mb-8">
                                <DynamicMap
                                    center={liveLocation ? liveLocation : [40.7128, -74.0060]}
                                    zoom={13}
                                    routing={
                                        selectedIncident && selectedIncident.status === 'RESPONDING' && liveLocation
                                            ? {
                                                start: liveLocation,
                                                end: getMockCoordinates(selectedIncident.id)
                                            }
                                            : undefined
                                    }
                                    markers={[
                                        ...incidents.filter(inc => inc.status !== 'CLOSED').map(inc => {
                                            const coords = getMockCoordinates(inc.id);
                                            return {
                                                id: inc.id,
                                                lat: coords[0],
                                                lng: coords[1],
                                                title: `Incident #${inc.id.split('-')[0].toUpperCase()}`,
                                                description: `Status: ${inc.status}`,
                                                isUrgent: inc.status === 'SUBMITTED' // Red if waiting for response
                                            };
                                        }),
                                        // Inject the officer's live location as a special marker
                                        ...(liveLocation ? [{
                                            id: 'patrol-unit-self',
                                            lat: liveLocation[0],
                                            lng: liveLocation[1],
                                            title: 'My Patrol Unit',
                                            description: 'Live GPS Location',
                                            isOfficer: true
                                        }] : [])
                                    ]}
                                />
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
                                            <div className="flex justify-between items-center mb-4 border-b border-[#262626] pb-2">
                                                <h3 className="text-lg font-bold text-gray-300">Incident Details</h3>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedIncident.status === 'RESPONDING' ? 'bg-blue-900/50 text-[#3b82f6]' :
                                                    selectedIncident.status === 'ON_SCENE' ? 'bg-yellow-900/50 text-yellow-500' :
                                                        selectedIncident.status === 'STABILIZED' ? 'bg-green-900/50 text-green-500' :
                                                            'bg-gray-800 text-gray-400'
                                                    }`}>{selectedIncident.status}</span>
                                            </div>
                                            <p className="text-gray-100 text-lg mb-4 whitespace-pre-line">
                                                {citizenMeta?.coreDescription || selectedIncident.description}
                                            </p>
                                            {citizenMeta?.suspectLine && (
                                                <p className="text-sm text-gray-300 mb-1">
                                                    <span className="font-semibold text-gray-400">Suspect Details: </span>
                                                    {citizenMeta.suspectLine.replace(/^[Ss]uspect details:\s*/,'')}
                                                </p>
                                            )}
                                            {citizenMeta?.evidenceLine && (() => {
                                                const raw = citizenMeta.evidenceLine.replace(/^[Ee]vidence:\s*/, '');
                                                const urlMatch = raw.match(/https?:\/\/\S+/);
                                                if (urlMatch) {
                                                    const url = urlMatch[0];
                                                    const label = raw.replace(url, '').trim() || 'Download attachment';
                                                    return (
                                                        <p className="text-sm text-gray-300 mb-3">
                                                            <span className="font-semibold text-gray-400">Citizen Evidence File: </span>
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[#38bdf8] hover:text-sky-300 hover:underline"
                                                            >
                                                                {label || url}
                                                            </a>
                                                        </p>
                                                    );
                                                }
                                                return (
                                                    <p className="text-sm text-gray-300 mb-3">
                                                        <span className="font-semibold text-gray-400">Citizen Evidence Note: </span>
                                                        {raw}
                                                    </p>
                                                );
                                            })()}
                                            <div className="flex items-center text-gray-400">
                                                <MapPin className="w-5 h-5 mr-2 text-red-500" /> {selectedIncident.location}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl">
                                                <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Field Evidence Locker</h3>
                                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#262626] rounded-xl hover:border-[#3b82f6]/50 transition-colors bg-[#0a0a0a]">
                                                    <Camera className="w-8 h-8 text-gray-500 mb-3" />
                                                    <p className="text-sm text-center text-gray-400 mb-4">Upload digital scene photos, bodycam footage, or audio statements.</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*,video/*,audio/*"
                                                        className="mb-2"
                                                        onChange={handleFileChange}
                                                        capture
                                                    />
                                                    <div className="flex space-x-2 mb-2">
                                                        <button onClick={() => startRecording('video')} disabled={!!recordingType} className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs">Record Video</button>
                                                        <button onClick={() => startRecording('audio')} disabled={!!recordingType} className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-xs">Record Audio</button>
                                                        {recordingType && <button onClick={stopRecording} className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded text-xs">Stop</button>}
                                                    </div>
                                                    {evidenceFile && <div className="text-xs text-gray-300 mb-2">Selected: {evidenceFile.name}</div>}
                                                    <button onClick={handleUploadEvidence} disabled={!evidenceFile || uploading} className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center disabled:opacity-50">
                                                        <UploadCloud className="w-4 h-4 mr-2" /> {uploading ? 'Uploading...' : 'Upload Evidence'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl">
                                                <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Field Notes</h3>
                                                <textarea
                                                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-colors"
                                                    rows={4}
                                                    placeholder="Enter observations, witness statements, etc."
                                                    value={fieldNotes}
                                                    onChange={(e) => setFieldNotes(e.target.value)}
                                                />
                                                <button onClick={handleUpdateNotes} className="mt-4 w-full bg-[#262626] hover:bg-[#333] text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center">
                                                    <FileText className="w-4 h-4 mr-2" /> Submit Notes
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-[#171717] border border-[#262626] p-6 rounded-2xl">
                                            <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-[#262626] pb-2">Actions</h3>
                                            <div className="space-y-3">
                                                <div className="flex space-x-2 pb-4 mb-4 border-b border-[#262626]">
                                                    <button onClick={() => handleStatusUpdate('ON_SCENE')} className="flex-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/30 py-2 rounded-lg font-bold text-sm transition-colors">
                                                        Arrived On-Scene
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate('STABILIZED')} className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black border border-green-500/30 py-2 rounded-lg font-bold text-sm transition-colors">
                                                        Stabilize Area
                                                    </button>
                                                </div>
                                                <button onClick={handleResolve} className="w-full bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white border border-[#3b82f6]/30 px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center">
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
                                    <input type="text" placeholder="Search handled logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#171717] border border-[#262626] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#3b82f6] text-white w-64" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {incidents.filter(i => i.status !== 'SUBMITTED' && i.description.toLowerCase().includes(searchQuery.toLowerCase())).map(inc => (
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

                    {activeTab === 'profile' && (
                        <div>
                            <div className="flex justify-between items-center mb-8 border-b border-[#262626] pb-4">
                                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center">
                                    <UserCircle className="w-8 h-8 mr-3 text-[#3b82f6]" /> Profile & Security
                                </h2>
                            </div>
                            <ProfilePanel />
                        </div>
                    )}

                </div>
            </div>
        </div >
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
