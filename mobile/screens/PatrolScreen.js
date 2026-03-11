import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, TextInput } from 'react-native';
import { MapPin, Navigation, LogOut } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function PatrolScreen() {
    const { user, logout, updateUser } = useAuthStore();
    const [incidents, setIncidents] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState('dispatch');

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchIncidents();
    }, []);

    useEffect(() => {
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
                badgeNumber: profile.badgeNumber,
                station: profile.station,
                rank: profile.rank,
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
                    <Text style={styles.headerTitle}>Tactical Display</Text>
                    <Text style={styles.headerSub}>Officer: {user?.email}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut color="#ef4444" size={20} />
                </TouchableOpacity>
            </View>

            <View style={styles.statusBanner}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>DISPATCH LINK ACTIVE</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, tab === 'dispatch' && styles.activeTab]} onPress={() => setTab('dispatch')}>
                    <Text style={[styles.tabText, tab === 'dispatch' && styles.activeTabText]}>Dispatch</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === 'profile' && styles.activeTab]} onPress={() => setTab('profile')}>
                    <Text style={[styles.tabText, tab === 'profile' && styles.activeTabText]}>Profile</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
            >
                {tab === 'dispatch' ? (
                    incidents.length === 0 ? (
                        <Text style={styles.emptyText}>No active dispatches.</Text>
                    ) : (
                        incidents.map(inc => (
                            <View key={inc.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.idText}>INCIDENT #{inc.id.split('-')[0].toUpperCase()}</Text>
                                    <View style={[styles.badge, inc.status === 'SUBMITTED' ? styles.badgeWait : styles.badgeRes]}>
                                        <Text style={[styles.badgeText, inc.status === 'SUBMITTED' ? styles.bTextWait : styles.bTextRes]}>{inc.status}</Text>
                                    </View>
                                </View>

                                <Text style={styles.descText}>{inc.description}</Text>

                                <View style={styles.locBox}>
                                    <MapPin color="#3b82f6" size={16} style={{ marginRight: 8 }} />
                                    <Text style={styles.locText}>{inc.location}</Text>
                                </View>

                                <TouchableOpacity style={styles.respondBtn}>
                                    <Navigation color="white" size={16} style={{ marginRight: 8 }} />
                                    <Text style={styles.respondText}>Respond to Scene</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>Profile & Security</Text>
                        {profileLoading || !profile ? (
                            <Text style={styles.emptyText}>Loading profile…</Text>
                        ) : (
                            <>
                                {profile.jurisdiction ? (
                                    <Text style={styles.metaLine}>Jurisdiction: {String(profile.jurisdiction)}</Text>
                                ) : null}
                                <Text style={styles.label}>FULL NAME</Text>
                                <TextInput style={styles.input} value={profile.name || ''} onChangeText={(v) => setProfile({ ...profile, name: v })} placeholderTextColor="#52525b" />
                                <Text style={styles.label}>EMAIL</Text>
                                <TextInput style={styles.input} value={profile.email || ''} onChangeText={(v) => setProfile({ ...profile, email: v })} placeholderTextColor="#52525b" autoCapitalize="none" />
                                <Text style={styles.label}>BADGE NUMBER</Text>
                                <TextInput style={styles.input} value={profile.badgeNumber || ''} onChangeText={(v) => setProfile({ ...profile, badgeNumber: v })} placeholderTextColor="#52525b" />
                                <Text style={styles.label}>STATION</Text>
                                <TextInput style={styles.input} value={profile.station || ''} onChangeText={(v) => setProfile({ ...profile, station: v })} placeholderTextColor="#52525b" />
                                <Text style={styles.label}>RANK</Text>
                                <TextInput style={styles.input} value={profile.rank || ''} onChangeText={(v) => setProfile({ ...profile, rank: v })} placeholderTextColor="#52525b" />

                                <TouchableOpacity style={[styles.respondBtn, savingProfile && { opacity: 0.5 }]} onPress={saveProfile} disabled={savingProfile}>
                                    <Text style={styles.respondText}>{savingProfile ? 'Saving…' : 'Save Profile'}</Text>
                                </TouchableOpacity>

                                <View style={{ marginTop: 25, borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 20 }}>
                                    <Text style={styles.sectionTitle}>Change Password</Text>
                                    <Text style={styles.label}>CURRENT PASSWORD</Text>
                                    <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
                                    <Text style={styles.label}>NEW PASSWORD</Text>
                                    <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                                    <TouchableOpacity style={styles.respondBtn} onPress={changePassword}>
                                        <Text style={styles.respondText}>Update Password</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#171717', borderBottomWidth: 1, borderBottomColor: '#262626' },
    headerTitle: { color: '#3b82f6', fontSize: 20, fontWeight: 'bold' },
    headerSub: { color: '#9ca3af', fontSize: 12 },
    logoutBtn: { padding: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8 },
    statusBanner: { backgroundColor: 'rgba(59,130,246,0.1)', paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(59,130,246,0.2)' },
    statusDot: { width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: 4, marginRight: 8 },
    statusText: { color: '#60a5fa', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#262626' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
    tabText: { color: '#6b7280', fontWeight: 'bold' },
    activeTabText: { color: '#3b82f6' },
    content: { padding: 20, paddingBottom: 40 },
    sectionTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    label: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15, letterSpacing: 1 },
    input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#262626', borderRadius: 12, padding: 15, color: '#ffffff', fontSize: 16 },
    card: { backgroundColor: '#171717', borderWidth: 1, borderColor: '#262626', borderRadius: 16, padding: 20, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    idText: { color: '#6b7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeWait: { backgroundColor: 'rgba(234,179,8,0.1)' },
    badgeRes: { backgroundColor: 'rgba(139,92,246,0.1)' },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    bTextWait: { color: '#fcd34d' },
    bTextRes: { color: '#c4b5fd' },
    descText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    locBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 12, borderRadius: 8, marginBottom: 20 },
    locText: { color: '#d1d5db', fontSize: 14, flex: 1 },
    respondBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    respondText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 40 },
    metaLine: { color: '#9ca3af', marginBottom: 6 }
});
