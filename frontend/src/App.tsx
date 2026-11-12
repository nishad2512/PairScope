import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LoadError, Loading } from "@/components/ui/feedback";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { useAuth } from "@/hooks/use-auth";
import { DashboardPage } from "@/pages/dashboard-page";
import { JoinSessionPage } from "@/pages/join-session-page";
import { LoginPage } from "@/pages/login-page";
import { NewSessionPage } from "@/pages/new-session-page";
import { SessionPage } from "@/pages/session-page";
import { SessionsPage } from "@/pages/sessions-page";
import { SignupPage } from "@/pages/signup-page";

function AuthReady() {
  const { loading, restoreError, restore } = useAuth();
  if (loading) return <main className="center-screen"><Loading label="Opening PairScope…" /></main>;
  if (restoreError) return <main className="center-screen"><LoadError message={restoreError} retry={restore} /></main>;
  return <Outlet />;
}

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <WorkspaceLayout />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthReady />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/join/:token" element={<JoinSessionPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/sessions/new" element={<NewSessionPage />} />
              <Route path="/sessions/:sessionId" element={<SessionPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
