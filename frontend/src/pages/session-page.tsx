import { ArrowLeft, Braces } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { InviteForm } from "@/components/sessions/invite-form";
import { formatDate, SessionBadge } from "@/components/sessions/session-display";
import { LoadError, Loading } from "@/components/ui/feedback";
import { useSessions } from "@/hooks/use-sessions";
import { authService } from "@/services/auth-service";

export function SessionPage() {
  const { sessionId } = useParams();
  const { sessions, loading, error, retry } = useSessions();
  const session = sessions.find((item) => item.id === sessionId);

  return (
    <>
      <Link className="text-link back-link" to="/sessions"><ArrowLeft size={16} aria-hidden="true" />Sessions</Link>
      {loading ? <Loading label="Loading session…" /> : error ? <LoadError message={error} retry={retry} />
        : !session ? (
          <section className="panel padded-panel"><h1>Session unavailable</h1><p className="muted">This session is unavailable to your account.</p></section>
        ) : (
          <>
            <section className="panel session-header">
              <span className="session-icon"><Braces size={25} aria-hidden="true" /></span>
              <div>
                <p className="muted">{session.sessionType === "interview" ? "Technical interview" : "Pair programming"}</p>
                <h1>{session.title}</h1>
                <p className="muted">{session.language}</p>
              </div>
              <SessionBadge status={session.status} />
            </section>
            <div className="detail-grid">
              <section className="panel padded-panel">
                <h2>Session details</h2>
                {session.description && <p className="session-description">{session.description}</p>}
                <dl className="detail-list">
                  <div><dt>Created</dt><dd>{formatDate(session.createdAt)}</dd></div>
                  {session.scheduledAt && <div><dt>Scheduled</dt><dd>{formatDate(session.scheduledAt)}</dd></div>}
                  {session.startedAt && <div><dt>Started</dt><dd>{formatDate(session.startedAt)}</dd></div>}
                  {session.endedAt && <div><dt>Ended</dt><dd>{formatDate(session.endedAt)}</dd></div>}
                  {session.expiresAt && <div><dt>Expires</dt><dd>{formatDate(session.expiresAt)}</dd></div>}
                </dl>
              </section>
              {session.ownerId === authService.currentUserId() &&
                (session.status === "live" || session.status === "scheduled") &&
                (!session.expiresAt || Date.parse(session.expiresAt) > Date.now()) &&
                <InviteForm key={session.id} session={session} />}
            </div>
          </>
        )}
    </>
  );
}
