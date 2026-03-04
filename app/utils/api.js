import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Depending on the emulator or physical device, localhost might need to be the networking IP.
// 10.0.2.2 is typical for Android Emulators. Using localhost for standard web/expo-go tests.
const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('guardian_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) { }

    return config;
});

export default api;
