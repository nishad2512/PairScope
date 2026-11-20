import axios, {
    AxiosError,
    type InternalAxiosRequestConfig,
} from 'axios';
import { API_ROUTES } from '../constants/api.routes';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = axios
            .post<{ accessToken: string }>(
                `/api${API_ROUTES.AUTH.REFRESH}`,
                {},
                { withCredentials: true },
            )
            .then((res) => {
                useAuthStore.getState().setAccessToken(res.data.accessToken);
                return res.data.accessToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

apiClient.interceptors.response.use(
    (response) => response.data,

    async (error: AxiosError) => {
        const original = error.config as
            | (InternalAxiosRequestConfig & { _retry?: boolean })
            | undefined;

        const isAuthRoute = original?.url?.includes(API_ROUTES.AUTH.REFRESH);
        const canRetry = original && !original._retry && !isAuthRoute;

        if (error.response?.status === 401 && canRetry) {
            original._retry = true;
            try {
                const token = await refreshAccessToken();
                original.headers.Authorization = `Bearer ${token}`;
                return apiClient(original);
            } catch {
                useAuthStore.getState().clearAuth();
                window.location.assign('/login');
            }
        }

        const body = error.response?.data as { message?: string } | undefined;
        throw new Error(body?.message ?? error.message ?? 'Request failed');
    },
);