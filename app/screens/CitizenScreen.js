import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MapPin, Clock, LogOut, Send } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function CitizenScreen() {
    const { user, logout } = useAuthStore();
    const [tab, setTab] = useState('report');

    const [desc, setDesc] = useState('');
    const [loc, setLoc] = useState('');
    const [loading, setLoading] = useState(false);

    const [incidents, setIncidents] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (tab === 'history') fetchIncidents();
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
            ) : (
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
});
