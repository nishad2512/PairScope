import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../store/auth.store';

export function RequireAuth() {
    const accessToken = useAuthStore((s) => s.accessToken);
    if (!accessToken) return <Navigate to="/login" replace />;
    return <Outlet />;
}

export function RequireAnon() {
    const accessToken = useAuthStore((s) => s.accessToken);
    if (accessToken) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}