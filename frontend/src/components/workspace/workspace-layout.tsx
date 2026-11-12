import { LayoutDashboard, List, LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Brand } from "@/components/ui/brand";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api-client";

export function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const name = user?.displayName || user?.email || "Account";

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      await logout();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Workspace">
          <NavLink to="/dashboard" end><LayoutDashboard size={18} aria-hidden="true" />Dashboard</NavLink>
          <NavLink to="/sessions"><List size={18} aria-hidden="true" />Sessions</NavLink>
        </nav>
        <div className="account">
          <div className="account-info">
            <span className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
            <span><strong>{name}</strong><small>{user?.email}</small></span>
          </div>
          <button className="icon-button" onClick={signOut} disabled={signingOut} aria-label={signingOut ? "Signing out" : "Sign out"} title="Sign out">
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <span>Workspace <span aria-hidden="true">/</span> <strong>{location.pathname === "/dashboard" ? "Dashboard" : "Sessions"}</strong></span>
          {location.pathname !== "/sessions/new" && <Link className="button primary" to="/sessions/new"><Plus size={17} aria-hidden="true" />New session</Link>}
        </header>
        <main className="workspace-main"><Outlet /></main>
      </div>
    </div>
  );
}
