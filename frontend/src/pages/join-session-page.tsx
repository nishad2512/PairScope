import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthSectionOne } from "@/components/ui/auth-section-1";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api-client";
import { sessionService } from "@/services/session-service";

export function JoinSessionPage() {
  const { token } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [error, setError] = useState("");
  const [guestRole, setGuestRole] = useState("");

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || submitting) return;
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    setNameError("");
    setError("");
    if (name.length < 3 || name.length > 20) {
      setNameError("Use 3–20 characters for your name.");
      form.querySelector<HTMLInputElement>("#guest-name")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const acceptance = await sessionService.join(token, name, Boolean(user));
      if ("result" in acceptance) {
        setGuestRole(acceptance.result.role.toLowerCase());
      } else {
        navigate(`/sessions/${encodeURIComponent(acceptance.sessionId)}`, { replace: true });
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSectionOne>
      {guestRole ? (
        <div className="auth-form">
          <CheckCircle2 size={28} aria-hidden="true" />
          <h1>Invitation accepted</h1>
          <p className="muted">You joined as a {guestRole}.</p>
        </div>
      ) : (
        <div className="auth-form">
          <h1>Join a session</h1>
          <p className="muted">Enter the name you want the host to see.</p>
          {token && /^[a-f0-9]{64}$/i.test(token) ? (
            <form className="form-stack" onSubmit={join} noValidate>
              <FormField id="guest-name" label="Display name" error={nameError}>
                <input id="guest-name" name="name" autoComplete="name" defaultValue={user?.displayName} required
                  aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "guest-name-feedback" : undefined}
                  onChange={() => { setNameError(""); setError(""); }} />
              </FormField>
              {error && <p className="notice error" role="alert">{error}</p>}
              <button className="button primary" disabled={submitting}>
                {submitting ? "Joining…" : "Accept invitation"} <ArrowRight size={17} aria-hidden="true" />
              </button>
              {!user && <p className="auth-switch muted">Have an account? <Link to="/login" state={{ from: location.pathname }}>Sign in</Link></p>}
            </form>
          ) : <p className="notice error" role="alert">This invitation link is invalid.</p>}
        </div>
      )}
    </AuthSectionOne>
  );
}
