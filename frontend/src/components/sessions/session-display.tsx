import { ArrowUpRight, Braces, CalendarDays, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { Session, SessionStatus } from "@/types/session";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function formatDate(value: string | null) {
  return value ? dateFormat.format(new Date(value)) : "—";
}

export function SessionBadge({ status }: { status: SessionStatus }) {
  return <span className={`status-badge ${status}`}><span />{status}</span>;
}

export function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <ul className="session-list">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link className="session-row" to={`/sessions/${session.id}`}>
            <span className="session-icon"><Braces size={20} aria-hidden="true" /></span>
            <span className="session-title">
              <strong>{session.title}</strong>
              <small>{session.language} · {session.sessionType === "interview" ? "Interview" : "Collaboration"}</small>
            </span>
            <span className="session-date">{formatDate(session.scheduledAt ?? session.createdAt)}</span>
            <SessionBadge status={session.status} />
            <ArrowUpRight className="row-arrow" size={17} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function EmptySessions({ filtered = false }: { filtered?: boolean }) {
  const Icon = filtered ? Search : CalendarDays;
  return (
    <div className="feedback empty">
      <span className="session-icon"><Icon size={22} aria-hidden="true" /></span>
      <h3>{filtered ? "No matching sessions" : "No sessions yet"}</h3>
      <p className="muted">{filtered ? "Try a different search or status." : "Create a session to start pairing or schedule an interview."}</p>
      {!filtered && <Link className="button secondary" to="/sessions/new">Create a session</Link>}
    </div>
  );
}
