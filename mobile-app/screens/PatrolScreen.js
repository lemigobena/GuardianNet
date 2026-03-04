import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MapPin, Navigation, LogOut } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function PatrolScreen() {
    const { user, logout } = useAuthStore();
    const [incidents, setIncidents] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchIncidents();
    }, []);

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

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
            >
                {incidents.length === 0 ? (
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
    content: { padding: 20, paddingBottom: 40 },
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
    emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 40 }
});
