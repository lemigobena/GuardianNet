import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Fingerprint, CheckCircle, XCircle } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function BiometricModal({ visible, onClose, onSuccess, title = "Biometric Required" }) {
    const [status, setStatus] = useState('idle'); // idle, scanning, success, error
    const setBiometricToken = useAuthStore(state => state.setBiometricToken);

    const handleScan = async () => {
        setStatus('scanning');
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const res = await api.post('/auth/biometric');
            setBiometricToken(res.data.biometricToken);
            setStatus('success');

            setTimeout(() => {
                onSuccess(res.data.biometricToken);
                setStatus('idle');
                onClose();
            }, 1000);
        } catch (err) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>Scan fingerprint to confirm action.</Text>

                    <TouchableOpacity
                        style={[styles.scanCircle, status === 'scanning' && styles.scanningPulse]}
                        onPress={status === 'idle' ? handleScan : null}
                        disabled={status !== 'idle'}
                    >
                        {status === 'idle' && <Fingerprint color="#3b82f6" size={60} />}
                        {status === 'scanning' && <ActivityIndicator color="#3b82f6" size="large" />}
                        {status === 'success' && <CheckCircle color="#10b981" size={60} />}
                        {status === 'error' && <XCircle color="#ef4444" size={60} />}
                    </TouchableOpacity>

                    <Text style={[styles.statusText, status === 'success' ? { color: '#10b981' } : status === 'error' ? { color: '#ef4444' } : null]}>
                        {status === 'idle' ? 'TAP TO SCAN' :
                            status === 'scanning' ? 'VERIFYING...' :
                                status === 'success' ? 'CONFIRMED' : 'FAILED - RETRY'}
                    </Text>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel Operation</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    card: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 20,
        padding: 30,
        width: '100%',
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10
    },
    subtitle: {
        color: '#9ca3af',
        marginBottom: 30,
        textAlign: 'center'
    },
    scanCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    scanningPulse: {
        borderColor: '#3b82f6',
    },
    statusText: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
        marginTop: 10
    },
    cancelBtn: {
        marginTop: 30
    },
    cancelText: {
        color: '#6b7280',
        fontSize: 14
    }
});
