import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import {
  CalendarDays,
  Code2,
  Copy,
  Check,
  Link2,
  Users,
  Layers2,
} from "lucide-react";
import { createInvite, getSessions } from "../../api/session.api";
import { useResource } from "../../hooks/use-resource";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Loading,
  Notice,
  Select,
} from "../../components/ui/primitives";
import { dateTime, errorMessage, readable } from "../../lib/format";
import type { InviteRole } from "../../types/api.types";
export default function SessionData() {
  const { sessionId } = useParams();
  const { data, loading, error, reload } = useResource(getSessions);
  const session = data?.find((s) => s.id === sessionId);
  const [busy, setBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionId) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setInviteError("");
    setUrl("");
    try {
      const response = await createInvite(sessionId, {
        role: String(form.get("role")) as InviteRole,
        email: String(form.get("email")).trim() || null,
      });
      setUrl(
        `${window.location.origin}/join/${encodeURIComponent(response.token)}`,
      );
      setCopied(false);
    } catch (error) {
      setInviteError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setInviteError(
        "Clipboard access is unavailable. Select and copy the invitation link below.",
      );
    }
  }
  if (loading) return <Loading />;
  if (error)
    return (
      <>
        <Notice>{error}</Notice>
        <Button onClick={reload}>Try again</Button>
      </>
    );
  if (!session)
    return (
      <EmptyState
        icon={<Layers2 />}
        title="Session not found"
        action={
          <Link className="button button-primary" to="/sessions">
            Back to sessions
          </Link>
        }
      >
        This session may be unavailable or belong to another workspace.
      </EmptyState>
    );
  return (
    <>
      <Link className="text-link back-link" to="/sessions">
        Back to sessions
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{readable(session.sessionType)}</span>
          <h1>
            {session.title}
            <span className="orange">.</span>
          </h1>
          <p>
            {session.description ||
              "A shared space for your next great conversation."}
          </p>
        </div>
        <Badge>{readable(session.status)}</Badge>
      </div>
      <div className="detail-grid">
        <section className="panel detail-panel">
          <div className="section-heading">
            <h2>Session overview</h2>
            <Code2 size={20} />
          </div>
          <dl className="details-list">
            <div>
              <dt>
                <Code2 size={17} />
                Language
              </dt>
              <dd>{session.language}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={17} />
                Scheduled for
              </dt>
              <dd>{dateTime(session.scheduledAt)}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={17} />
                Created
              </dt>
              <dd>{dateTime(session.createdAt)}</dd>
            </div>
            <div>
              <dt>
                <Users size={17} />
                Session type
              </dt>
              <dd>{readable(session.sessionType)}</dd>
            </div>
            {session.expiresAt && (
              <div>
                <dt>Expires</dt>
                <dd>{dateTime(session.expiresAt)}</dd>
              </div>
            )}
          </dl>
          <div className="session-note">
            <span className="empty-icon">
              <MessagesIcon />
            </span>
            <h3>Make every perspective count.</h3>
            <p>
              Share an invitation with your teammate or candidate to bring them
              into the session.
            </p>
          </div>
        </section>
        <section className="panel detail-panel">
          <div className="section-heading">
            <div>
              <h2>Better with a pair</h2>
              <p>Invite someone into the conversation.</p>
            </div>
            <Link2 size={20} />
          </div>
          <form className="form-stack panel-padding" onSubmit={invite}>
            {inviteError && <Notice>{inviteError}</Notice>}
            <Select label="Invite as" name="role">
              {(session.sessionType.toUpperCase() === "INTERVIEW"
                ? ["CANDIDATE", "INTERVIEWER", "OBSERVER"]
                : ["COLLABORATOR", "OBSERVER"]
              ).map((role) => (
                <option key={role} value={role}>
                  {readable(role)}
                </option>
              ))}
            </Select>
            <Field
              label="Email address (optional)"
              type="email"
              name="email"
              placeholder="teammate@company.com"
              hint="An email can restrict who can use the invitation."
            />
            <Button busy={busy}>
              <Link2 size={16} />
              Generate invitation link
            </Button>
            {url && (
              <div className="invite-result">
                <label className="field">
                  <span>Your invitation link</span>
                  <input
                    value={url}
                    readOnly
                    onFocus={(event) => event.target.select()}
                  />
                </label>
                <Button type="button" variant="secondary" onClick={copy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <small>Share this link directly with your guest.</small>
              </div>
            )}
          </form>
        </section>
      </div>
    </>
  );
}
function MessagesIcon() {
  return <Users size={25} />;
}
