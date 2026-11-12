import { ArrowRight, CalendarDays, Layers, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptySessions, SessionList } from "@/components/sessions/session-display";
import { LoadError, Loading } from "@/components/ui/feedback";
import { useAuth } from "@/hooks/use-auth";
import { useSessions } from "@/hooks/use-sessions";

export function DashboardPage() {
  const { user } = useAuth();
  const { sessions, loading, error, retry } = useSessions();
  const firstName = user?.displayName?.trim().split(/\s+/)[0];
  const stats = [
    { label: "Total sessions", value: sessions.length, icon: Layers },
    { label: "Live now", value: sessions.filter((session) => session.status === "live").length, icon: Radio },
    { label: "Scheduled", value: sessions.filter((session) => session.status === "scheduled").length, icon: CalendarDays },
  ];

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <h1>{firstName ? `Welcome, ${firstName}` : "Welcome to PairScope"}</h1>
          <p>Start a pairing session or plan your next technical interview.</p>
          <Link className="button hero-action" to="/sessions/new">Create a session <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="hero-decoration" aria-hidden="true">{"{ }"}</div>
      </section>
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="stat panel" key={label}>
            <span className="session-icon"><Icon size={19} aria-hidden="true" /></span>
            <div><p>{label}</p><strong>{loading || error ? "—" : value}</strong></div>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Recent sessions</h2>
          <Link className="text-link" to="/sessions">View all <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        {loading ? <Loading label="Loading sessions…" />
          : error ? <LoadError message={error} retry={retry} />
          : sessions.length ? <SessionList sessions={sessions.slice(0, 5)} /> : <EmptySessions />}
      </section>
    </>
  );
}
