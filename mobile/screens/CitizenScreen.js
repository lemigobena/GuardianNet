import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MapPin, Clock, LogOut, Send } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function CitizenScreen() {
    const { user, logout, updateUser } = useAuthStore();
    const [tab, setTab] = useState('report');

    const [desc, setDesc] = useState('');
    const [loc, setLoc] = useState('');
    const [loading, setLoading] = useState(false);

    const [incidents, setIncidents] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (tab === 'history') fetchIncidents();
        if (tab === 'profile') fetchProfile();
    }, [tab]);

    const fetchIncidents = async () => {
        try {
            const res = await api.get('/incidents');
            setIncidents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchIncidents();
    };

    const submitReport = async () => {
        if (!desc || !loc) return alert("Please fill all fields.");
        setLoading(true);
        try {
            await api.post('/incidents', { description: desc, location: loc });
            setDesc(''); setLoc('');
            alert("Incident successfully reported.");
            setTab('history');
        } catch (err) {
            alert("Failed to submit.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        setProfileLoading(true);
        try {
            const res = await api.get('/profile');
            setProfile(res.data);
        } catch (err) {
            alert('Failed to load profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!profile) return;
        setSavingProfile(true);
        try {
            const res = await api.put('/profile', {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
            });
            setProfile(res.data);
            updateUser({ name: res.data.name, email: res.data.email });
            alert('Profile updated.');
        } catch (err) {
            alert('Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const changePassword = async () => {
        if (!currentPassword || !newPassword) return alert('Enter current and new password.');
        try {
            await api.put('/profile/password', { currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            alert('Password updated.');
        } catch (err) {
            alert('Failed to update password.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Citizen Field Client</Text>
                    <Text style={styles.headerSub}>{user?.email}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut color="#ef4444" size={20} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, tab === 'report' && styles.activeTab]} onPress={() => setTab('report')}>
                    <Text style={[styles.tabText, tab === 'report' && styles.activeTabText]}>Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === 'history' && styles.activeTab]} onPress={() => setTab('history')}>
                    <Text style={[styles.tabText, tab === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === 'profile' && styles.activeTab]} onPress={() => setTab('profile')}>
                    <Text style={[styles.tabText, tab === 'profile' && styles.activeTabText]}>Profile</Text>
                </TouchableOpacity>
            </View>

            {tab === 'report' ? (
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text style={styles.sectionTitle}>New Incident Report</Text>

                    <Text style={styles.label}>LOCATION / GPS</Text>
                    <TextInput
                        style={styles.input}
                        value={loc} onChangeText={setLoc}
                        placeholder="Nearest address or landmark"
                        placeholderTextColor="#52525b"
                    />

                    <Text style={styles.label}>DESCRIPTION</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={desc} onChangeText={setDesc}
                        placeholder="Describe the incident details securely..."
                        placeholderTextColor="#52525b"
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.5 }]} onPress={submitReport} disabled={loading}>
                        <Send color="#0a0a0a" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.submitText}>{loading ? 'Transmitting...' : 'Submit to GuardianNet'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : tab === 'history' ? (
                <ScrollView
                    style={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />}
                >
                    {incidents.length === 0 ? (
                        <Text style={styles.emptyText}>No reports found.</Text>
                    ) : (
                        incidents.map(inc => (
                            <View key={inc.id} style={styles.card}>
                                <View style={[styles.badge, inc.status === 'SUBMITTED' ? styles.badgeSub : inc.status === 'UNDER_INVESTIGATION' ? styles.badgeInv : styles.badgeRes]}>
                                    <Text style={[styles.badgeText, inc.status === 'SUBMITTED' ? styles.bTextSub : inc.status === 'UNDER_INVESTIGATION' ? styles.bTextInv : styles.bTextRes]}>{inc.status}</Text>
                                </View>
                                <Text style={styles.descText}>{inc.description}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <MapPin color="#6b7280" size={14} style={{ marginRight: 4 }} />
                                        <Text style={styles.metaText}>{inc.location}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Clock color="#6b7280" size={14} style={{ marginRight: 4 }} />
                                        <Text style={styles.metaText}>{new Date(inc.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            ) : (
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text style={styles.sectionTitle}>Profile & Security</Text>

                    {profileLoading || !profile ? (
                        <Text style={styles.emptyText}>Loading profile…</Text>
                    ) : (
                        <>
                            {profile.jurisdiction ? (
                                <Text style={styles.metaLine}>Jurisdiction: {String(profile.jurisdiction)}</Text>
                            ) : null}
                            {profile.nationalIdMasked ? (
                                <Text style={styles.metaLine}>National ID: {String(profile.nationalIdMasked)}</Text>
                            ) : null}

                            <Text style={styles.label}>FULL NAME</Text>
                            <TextInput style={styles.input} value={profile.name || ''} onChangeText={(v) => setProfile({ ...profile, name: v })} placeholderTextColor="#52525b" />

                            <Text style={styles.label}>EMAIL</Text>
                            <TextInput style={styles.input} value={profile.email || ''} onChangeText={(v) => setProfile({ ...profile, email: v })} placeholderTextColor="#52525b" autoCapitalize="none" />

                            <Text style={styles.label}>PHONE</Text>
                            <TextInput style={styles.input} value={profile.phone || ''} onChangeText={(v) => setProfile({ ...profile, phone: v })} placeholderTextColor="#52525b" />

                            <Text style={styles.label}>ADDRESS</Text>
                            <TextInput style={styles.input} value={profile.address || ''} onChangeText={(v) => setProfile({ ...profile, address: v })} placeholderTextColor="#52525b" />

                            <TouchableOpacity style={[styles.submitBtn, savingProfile && { opacity: 0.5 }]} onPress={saveProfile} disabled={savingProfile}>
                                <Text style={styles.submitText}>{savingProfile ? 'Saving…' : 'Save Profile'}</Text>
                            </TouchableOpacity>

                            <View style={{ marginTop: 25, borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 20 }}>
                                <Text style={styles.sectionTitle}>Change Password</Text>
                                <Text style={styles.label}>CURRENT PASSWORD</Text>
                                <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
                                <Text style={styles.label}>NEW PASSWORD</Text>
                                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                                <TouchableOpacity style={styles.submitBtn} onPress={changePassword}>
                                    <Text style={styles.submitText}>Update Password</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#171717', borderBottomWidth: 1, borderBottomColor: '#262626' },
    headerTitle: { color: '#10b981', fontSize: 20, fontWeight: 'bold' },
    headerSub: { color: '#9ca3af', fontSize: 12 },
    logoutBtn: { padding: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#262626' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#10b981' },
    tabText: { color: '#6b7280', fontWeight: 'bold' },
    activeTabText: { color: '#10b981' },
    content: { padding: 20 },
    sectionTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    label: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#171717', borderWidth: 1, borderColor: '#262626', borderRadius: 12, padding: 15, color: '#white', fontSize: 16 },
    textArea: { minHeight: 120 },
    submitBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, marginTop: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    submitText: { color: '#0a0a0a', fontWeight: 'bold', fontSize: 16 },
    card: { backgroundColor: '#171717', borderWidth: 1, borderColor: '#262626', borderRadius: 16, padding: 20, marginBottom: 15 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
    badgeSub: { backgroundColor: '#262626' },
    badgeInv: { backgroundColor: 'rgba(139,92,246,0.2)' },
    badgeRes: { backgroundColor: 'rgba(16,185,129,0.2)' },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    bTextSub: { color: '#9ca3af' },
    bTextInv: { color: '#c4b5fd' },
    bTextRes: { color: '#6ee7b7' },
    descText: { color: 'white', fontSize: 16, marginBottom: 15, lineHeight: 22 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 15 },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaText: { color: '#6b7280', fontSize: 12 },
    emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 40 }
    ,metaLine: { color: '#9ca3af', marginBottom: 6 }
});
