import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/ui/form-field";

export function PasswordInput({ id, label, autoComplete, error, hint }: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  error?: string | undefined;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField id={id} label={label} error={error} {...(hint ? { hint } : {})}>
      <div className="password-field">
        <input id={id} name={id} type={visible ? "text" : "password"}
          autoComplete={autoComplete} required aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${id}-feedback` : undefined} />
        <button type="button" onClick={() => setVisible(!visible)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </FormField>
  );
}
