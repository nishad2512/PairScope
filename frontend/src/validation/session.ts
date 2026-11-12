import type { CreateSession } from "@/types/session";

export type SessionErrors = Partial<Record<keyof CreateSession, string>>;

export function validateSession(values: CreateSession): SessionErrors {
  const errors: SessionErrors = {};
  if (values.title.length < 3 || values.title.length > 100) errors.title = "Use 3–100 characters for the title.";
  if (values.description && values.description.length > 1000) errors.description = "Use at most 1,000 characters.";
  if (!values.language || values.language.length > 50) errors.language = "Enter a language up to 50 characters.";
  const now = Date.now();
  const scheduled = values.scheduledAt ? new Date(values.scheduledAt).getTime() : now;
  if (values.scheduledAt && (!Number.isFinite(scheduled) || scheduled <= now)) {
    errors.scheduledAt = "Choose a start time in the future.";
  }
  if (values.expiresAt) {
    const expires = new Date(values.expiresAt).getTime();
    if (!Number.isFinite(expires) || expires <= Math.max(scheduled || now, now)) {
      errors.expiresAt = "Choose a time after the session starts.";
    }
  }
  return errors;
}
