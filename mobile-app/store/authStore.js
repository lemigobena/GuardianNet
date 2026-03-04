import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set) => ({
    user: null,
    biometricToken: null,
    isHydrated: false,

    hydrate: async () => {
        try {
            const stored = await AsyncStorage.getItem('guardian_user');
            if (stored) {
                set({ user: JSON.parse(stored), isHydrated: true });
            } else {
                set({ isHydrated: true });
            }
        } catch (e) {
            set({ isHydrated: true });
        }
    },

    login: async (userData) => {
        await AsyncStorage.setItem('guardian_user', JSON.stringify(userData));
        await AsyncStorage.setItem('guardian_token', userData.token);
        set({ user: userData });
    },

    logout: async () => {
        await AsyncStorage.removeItem('guardian_user');
        await AsyncStorage.removeItem('guardian_token');
        set({ user: null, biometricToken: null });
    },

    setBiometricToken: (token) => {
        set({ biometricToken: token });
    }
}));

export default useAuthStore;
