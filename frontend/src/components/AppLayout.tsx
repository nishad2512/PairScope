import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
    LayoutDashboard,
    Layers2,
    Building2,
    LogOut,
    Menu,
    X,
    Code2,
    Plus,
} from "lucide-react";
import Brand from "./Brand";
import { Avatar, Button } from "./ui/primitives";
import { useAuthStore } from "../store/auth.store";
import { logout } from "../api/auth.api";
import CreateSessionDialog from "./CreateSessionDialog";
export default function AppLayout() {
    const user = useAuthStore((s) => s.user);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();
    const [leaving, setLeaving] = useState(false);
    async function signOut() {
        setLeaving(true);
        try {
            await logout();
        } catch {
            /* Local credentials are always cleared by logout. */
        } finally {
            navigate("/login");
        }
    }
    return (
        <div className="app-layout">
            <div className="mobile-top">
                <Brand />
                <button
                    className="icon-button"
                    aria-label={open ? "Close navigation" : "Open navigation"}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    {open ? <X /> : <Menu />}
                </button>
            </div>
            {open && (
                <button
                    className="sidebar-backdrop"
                    aria-label="Close navigation"
                    onClick={() => setOpen(false)}
                />
            )}
            <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
                <Brand />
                <div className="workspace-label">
                    <span className="workspace-icon">
                        <Code2 size={19} />
                    </span>
                    <div>
                        <strong>Personal workspace</strong>
                        <small>Your space to build</small>
                    </div>
                </div>
                <span className="nav-label">WORKSPACE</span>
                <nav>
                    {[
                        {
                            to: "/dashboard",
                            icon: LayoutDashboard,
                            label: "Overview",
                        },
                        { to: "/sessions", icon: Layers2, label: "Sessions" },
                        {
                            to: "/organizations",
                            icon: Building2,
                            label: "Organizations",
                        },
                    ].map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setOpen(false)}
                        >
                            <item.icon size={19} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-note">
                    <div className="pair-motif">
                        <span />
                        <span />
                    </div>
                    <h3>Good work takes two.</h3>
                    <p>Turn a conversation into your next breakthrough.</p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setCreating(true);
                            setOpen(false);
                        }}
                    >
                        <Plus size={16} />
                        Start a session
                    </Button>
                </div>
                <div className="profile">
                    <Avatar name={user?.displayName || "You"} small />
                    <div>
                        <strong>{user?.displayName || "Your account"}</strong>
                        <small>{user?.email}</small>
                    </div>
                    <button
                        className="icon-button"
                        disabled={leaving}
                        onClick={signOut}
                        aria-label="Sign out"
                    >
                        <LogOut size={17} />
                    </button>
                </div>
            </aside>
            <div className="main-column">
                <header className="workspace-header">
                    <span>
                        Workspace <span className="breadcrumb-divider">/</span>{" "}
                        <strong>Let’s make progress</strong>
                    </span>
                    <span className="header-note">
                        <span className="live-dot" /> A space for focused work
                    </span>
                </header>
                <main className="workspace-main">
                    <Outlet />
                </main>
                <footer className="workspace-footer">
                    <span>A shared space. A fresh perspective.</span>
                    <span>PairScope © {new Date().getFullYear()}</span>
                </footer>
            </div>
            {creating && (
                <CreateSessionDialog onClose={() => setCreating(false)} />
            )}
        </div>
    );
}
