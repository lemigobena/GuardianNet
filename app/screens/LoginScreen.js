import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const login = useAuthStore(state => state.login);

    const handleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            // Auto-register mock accounts for demo
            try {
                await api.post('/auth/register', {
                    name: email.split('@')[0],
                    email,
                    password,
                    role: email.includes('patrol') ? 'PATROL_OFFICER' :
                        email.includes('detective') ? 'DETECTIVE' :
                            email.includes('supervisor') ? 'SUPERVISOR' : 'CITIZEN'
                });
            } catch (err) { }

            const res = await api.post('/auth/login', { email, password });
            await login(res.data);
        } catch (err) {
            setError('Invalid credentials or network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Dark styling matching web application */}
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <ShieldAlert color="#3b82f6" size={40} />
                    </View>
                    <Text style={styles.title}>GuardianNet Mobile</Text>
                    <Text style={styles.subtitle}>Tactical & Citizen Field Access</Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>SYSTEM EMAIL</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="e.g. patrol@guardian.gov"
                        placeholderTextColor="#52525b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>PASSCODE</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Authenticate Securely</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#171717',
        borderRadius: 20,
        padding: 30,
        borderWidth: 1,
        borderColor: '#262626',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconContainer: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 15,
        borderRadius: 50,
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 5,
    },
    errorText: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        padding: 10,
        borderRadius: 8,
        textAlign: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#262626',
        color: '#ffffff',
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
