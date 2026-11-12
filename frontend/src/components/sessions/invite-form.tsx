import { Copy, Link2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { formatDate } from "@/components/sessions/session-display";
import { FormField } from "@/components/ui/form-field";
import { errorMessage } from "@/lib/api-client";
import { sessionService } from "@/services/session-service";
import type { Invitation, InviteRole, Session } from "@/types/session";
import { isEmail } from "@/validation/auth";

export function InviteForm({ session }: { session: Session }) {
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const link = invite ? new URL(`/join/${encodeURIComponent(invite.token)}`, window.location.origin).href : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    setError("");
    setEmailError("");
    if (email && !isEmail(email)) {
      setEmailError("Enter a valid email address.");
      form.querySelector<HTMLInputElement>("#invite-email")?.focus();
      return;
    }
    setSubmitting(true);
    setCopyStatus("");
    try {
      setInvite(await sessionService.invite(session.id, { role: data.get("role") as InviteRole, email: email || null }));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Link copied.");
    } catch {
      setCopyStatus("Select the link and copy it manually.");
    }
  }

  return (
    <section className="panel padded-panel">
      <h2>Invite a participant</h2>
      <p className="muted">Create a link to share with someone joining this session.</p>
      <form className="form-stack" onSubmit={submit} noValidate>
        <FormField id="invite-email" label="Email address (optional)" error={emailError}>
          <input id="invite-email" name="email" type="email" placeholder="teammate@example.com"
            aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "invite-email-feedback" : undefined}
            onChange={() => setEmailError("")} />
        </FormField>
        <FormField id="invite-role" label="Role">
          <select id="invite-role" name="role" defaultValue={session.sessionType === "interview" ? "CANDIDATE" : "COLLABORATOR"}>
            <option value="COLLABORATOR">Collaborator</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="INTERVIEWER">Interviewer</option>
            <option value="OBSERVER">Observer</option>
          </select>
        </FormField>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button secondary" disabled={submitting}><Link2 size={17} aria-hidden="true" />{submitting ? "Generating…" : "Generate invite link"}</button>
      </form>
      {invite && (
        <div className="invite-result">
          <FormField id="share-link" label="Share this link" hint={`Expires ${formatDate(invite.invitation.expiresAt)}`}>
            <div className="copy-row">
              <input id="share-link" readOnly value={link} aria-describedby="share-link-feedback"
                onFocus={(event) => event.currentTarget.select()} />
              <button className="button secondary" onClick={copy}><Copy size={16} aria-hidden="true" />Copy</button>
            </div>
          </FormField>
          {copyStatus && <p className="field-hint" role="status">{copyStatus}</p>}
        </div>
      )}
    </section>
  );
}
