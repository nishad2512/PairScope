import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api-client";
import { authService } from "@/services/auth-service";
import { validateAuth } from "@/validation/auth";
import type { AuthErrors } from "@/validation/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { setUser } = useAuth();
  const location = useLocation();
  const [errors, setErrors] = useState<AuthErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const signup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    };
    const invalid = validateAuth(values, signup);
    setErrors(invalid);
    setError("");
    const firstInvalid = Object.keys(invalid)[0];
    if (firstInvalid) {
      form.querySelector<HTMLInputElement>(`#${firstInvalid}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      setUser(await (signup
        ? authService.signup(values)
        : authService.login({ email: values.email, password: values.password })));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-form">
      <h1>{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{signup ? "Set up your PairScope workspace to start pairing." : "Sign in to pick up where you left off."}</p>
      <form className="form-stack" onSubmit={handleSubmit} noValidate onChange={(event) => {
        const name = (event.target as Element).getAttribute("name") as keyof AuthErrors;
        setErrors((current) => {
          const next = { ...current };
          delete next[name];
          if (name === "password") delete next.confirmPassword;
          return next;
        });
        setError("");
      }}>
        {signup && (
          <FormField id="name" label="Full name" error={errors.name}>
            <input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" required
              aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-feedback" : undefined} />
          </FormField>
        )}
        <FormField id="email" label="Email address" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-feedback" : undefined} />
        </FormField>
        <PasswordInput id="password" label="Password" error={errors.password}
          autoComplete={signup ? "new-password" : "current-password"}
          {...(signup ? { hint: "8–64 characters with uppercase, lowercase, and a number." } : {})} />
        {signup && <PasswordInput id="confirmPassword" label="Confirm password" autoComplete="new-password" error={errors.confirmPassword} />}
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button primary" disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
          {submitting ? (signup ? "Creating account…" : "Signing in…") : (signup ? "Create account" : "Sign in")}
          {!submitting && <ArrowRight size={17} aria-hidden="true" />}
        </button>
      </form>
      <p className="auth-switch muted">
        {signup ? "Already have an account?" : "New to PairScope?"}{" "}
        <Link to={signup ? "/login" : "/signup"} state={location.state}>{signup ? "Sign in" : "Create an account"}</Link>
      </p>
    </div>
  );
}
