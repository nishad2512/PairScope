import type { ReactNode } from "react";

export function FormField({ id, label, error, hint, children }: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p id={`${id}-feedback`} className="field-error">{error}</p>
        : hint && <p id={`${id}-feedback`} className="field-hint">{hint}</p>}
    </div>
  );
}
