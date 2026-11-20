import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../store/auth.store";

export function RequireAuth() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const location = useLocation();
    if (!accessToken)
        return (
            <Navigate
                to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                replace
            />
        );
    return <Outlet />;
}

export function RequireAnon() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const location = useLocation();
    const next = new URLSearchParams(location.search).get("next");
    if (accessToken)
        return (
            <Navigate
                to={
                    next?.startsWith("/") && !next.startsWith("//")
                        ? next
                        : "/dashboard"
                }
                replace
            />
        );
    return <Outlet />;
}
