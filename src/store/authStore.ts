import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    biometric_registered: boolean;
    token: string;
}

interface AuthState {
    user: User | null;
    biometricToken: string | null;
    login: (userData: User) => void;
    logout: () => void;
    setBiometricToken: (token: string) => void;
}

const useAuthStore = create<AuthState>((set) => {
    let initialUser = null;
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('guardian_user');
        if (stored) {
            try { initialUser = JSON.parse(stored); } catch (e) { }
        }
    }

    return {
        user: initialUser,
        biometricToken: null,

        login: (userData) => {
            localStorage.setItem('guardian_user', JSON.stringify(userData));
            localStorage.setItem('guardian_token', userData.token);
            set({ user: userData });
        },

        logout: () => {
            localStorage.removeItem('guardian_user');
            localStorage.removeItem('guardian_token');
            set({ user: null, biometricToken: null });
        },

        setBiometricToken: (token) => {
            set({ biometricToken: token });
        }
    };
});

export default useAuthStore;
