import { Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "@/components/ui/form-field";
import { errorMessage } from "@/lib/api-client";
import { sessionService } from "@/services/session-service";
import type { CreateSession } from "@/types/session";
import { validateSession } from "@/validation/session";
import type { SessionErrors } from "@/validation/session";

export function SessionForm() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<SessionErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function fieldProps(id: keyof CreateSession) {
    return { id, name: id, "aria-invalid": Boolean(errors[id]), "aria-describedby": errors[id] ? `${id}-feedback` : undefined };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const read = (key: string) => String(data.get(key) ?? "").trim();
    const values: CreateSession = {
      title: read("title"),
      description: read("description") || null,
      language: read("language"),
      sessionType: read("sessionType") === "INTERVIEW" ? "INTERVIEW" : "COLLABORATION",
      scheduledAt: read("scheduledAt") || null,
      expiresAt: read("expiresAt") || null,
    };
    const invalid = validateSession(values);
    setErrors(invalid);
    setError("");
    const firstInvalid = Object.keys(invalid)[0];
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const session = await sessionService.create({
        ...values,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      });
      navigate(`/sessions/${session.id}`, { replace: true });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel form-stack padded-panel session-form" noValidate onSubmit={submit}
      onChange={(event) => {
        const name = (event.target as Element).getAttribute("name") as keyof CreateSession;
        setErrors((current) => {
          const next = { ...current };
          delete next[name];
          if (name === "scheduledAt") delete next.expiresAt;
          return next;
        });
        setError("");
      }}>
      <FormField id="title" label="Session title" error={errors.title}>
        <input {...fieldProps("title")} placeholder="e.g. Pair on the checkout flow" maxLength={100} required />
      </FormField>
      <FormField id="description" label="Description (optional)" error={errors.description}>
        <textarea {...fieldProps("description")} rows={3} maxLength={1000} placeholder="What will you work on together?" />
      </FormField>
      <div className="field-grid">
        <FormField id="sessionType" label="Session type">
          <select {...fieldProps("sessionType")}>
            <option value="COLLABORATION">Collaboration</option><option value="INTERVIEW">Interview</option>
          </select>
        </FormField>
        <FormField id="language" label="Language" error={errors.language}>
          <input {...fieldProps("language")} list="languages" placeholder="e.g. TypeScript" maxLength={50} required />
          <datalist id="languages">
            {["TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "SQL"].map((language) => <option key={language} value={language} />)}
          </datalist>
        </FormField>
      </div>
      <div className="field-grid">
        <FormField id="scheduledAt" label="Scheduled start (optional)" error={errors.scheduledAt} hint="Leave blank to start now. Times use your local timezone.">
          <input {...fieldProps("scheduledAt")} aria-describedby="scheduledAt-feedback" type="datetime-local" />
        </FormField>
        <FormField id="expiresAt" label="Expires at (optional)" error={errors.expiresAt}>
          <input {...fieldProps("expiresAt")} type="datetime-local" />
        </FormField>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="form-actions">
        <Link className="button secondary" to="/sessions">Cancel</Link>
        <button className="button primary" disabled={submitting}><Plus size={17} aria-hidden="true" />{submitting ? "Creating…" : "Create session"}</button>
      </div>
    </form>
  );
}
