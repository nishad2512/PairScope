import axios from 'axios';
import { API_ROUTES } from '../constants/api.routes';
import { apiClient } from './client';
import { useAuthStore } from '../store/auth.store';
import type { AuthPayload, PublicUser } from '../types/api.types';

export interface SignupInput {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export async function signup(input: SignupInput): Promise<PublicUser> {
    const data = (await apiClient.post(
        API_ROUTES.AUTH.SIGNUP,
        input,
    )) as unknown as AuthPayload;
    useAuthStore.getState().setAuth(data.user, data.accessToken);
    return data.user;
}

export async function login(input: LoginInput): Promise<PublicUser> {
    const data = (await apiClient.post(
        API_ROUTES.AUTH.LOGIN,
        input,
    )) as unknown as AuthPayload;
    useAuthStore.getState().setAuth(data.user, data.accessToken);
    return data.user;
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post(API_ROUTES.USER.LOGOUT);
    } finally {
        useAuthStore.getState().clearAuth();
    }
}

let restorePromise: Promise<boolean> | null = null;

export function tryRestoreSession(): Promise<boolean> {
    if (!restorePromise) {
        restorePromise = (async () => {
            try {
                const { data } = await axios.post<{ accessToken: string }>(
                    `/api${API_ROUTES.AUTH.REFRESH}`,
                    {},
                    { withCredentials: true, timeout: 10_000 },
                );
                useAuthStore.getState().setAccessToken(data.accessToken);

                const me = (await apiClient.get(
                    API_ROUTES.USER.ME,
                )) as unknown as { user: PublicUser };
                useAuthStore.getState().setUser(me.user);
                return true;
            } catch {
                useAuthStore.getState().clearAuth();
                return false;
            } finally {
                restorePromise = null;
            }
        })();
    }
    return restorePromise;
}