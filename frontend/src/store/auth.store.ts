import { create } from 'zustand';
import type { PublicUser } from '../types/api.types';

interface AuthState {
    user: PublicUser | null;
    accessToken: string | null;
    setAuth: (user: PublicUser, accessToken: string) => void;
    setAccessToken: (accessToken: string) => void;
    setUser: (user: PublicUser) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    setAuth: (user, accessToken) => set({ user, accessToken }),
    setAccessToken: (accessToken) => set({ accessToken }),
    setUser: (user) => set({ user }),
    clearAuth: () => set({ user: null, accessToken: null }),
}));