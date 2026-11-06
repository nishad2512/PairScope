import { ArrowRight, LoaderCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PasswordInput } from "@/components/ui/password-input";
import type { LoginPayload, SignupPayload } from "@/types/auth";

type AuthFormProps = {
  mode: "login" | "signup";
  isSubmitting: boolean;
  error: string | null;
  onLogin: (payload: LoginPayload) => Promise<void>;
  onSignup: (payload: SignupPayload) => Promise<void>;
  onClearError: () => void;
};

export function AuthForm({
  mode,
  isSubmitting,
  error,
  onLogin,
  onSignup,
  onClearError,
}: AuthFormProps) {
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    onClearError();
    setPasswordMismatch(false);
    if (isSignup) {
      const confirmPassword = String(formData.get("confirmPassword") ?? "");
      if (password !== confirmPassword) {
        setPasswordMismatch(true);
        return;
      }

      await onSignup({
        name: String(formData.get("name") ?? "").trim(),
        email,
        password,
        confirmPassword,
      });
      return;
    }

    await onLogin({ email, password });
  }

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-9">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-orange-800">
          <span className="size-1.5 rounded-full bg-orange-600" />
          {isSignup ? "Your next chapter starts here" : "Good to see you again"}
        </span>
        <h1 className="text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.055em] text-stone-950 sm:text-5xl">
          {isSignup ? "Find your people." : "Welcome back."}
        </h1>
        <p className="mt-3 max-w-sm text-base leading-7 text-stone-500">
          {isSignup
            ? "Create your PairScope account and make room for better collaboration."
            : "Sign in to pick up where you and your team left off."}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {isSignup && (
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-stone-700"
            >
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={3}
              maxLength={20}
              placeholder="Your name"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10"
            />
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@company.com"
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10"
          />
        </div>

        <PasswordInput
          id="password"
          label="Password"
          autoComplete={isSignup ? "new-password" : "current-password"}
        />

        {isSignup && (
          <>
            <PasswordInput
              id="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
            />
            <p className="-mt-2 text-xs leading-5 text-stone-500">
              Use 8–64 characters with an uppercase letter, a lowercase letter,
              and a number.
            </p>
          </>
        )}

        {passwordMismatch && (
          <p role="alert" className="text-sm font-medium text-red-700">
            Your passwords do not match.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              {isSignup ? "Creating your account…" : "Signing you in…"}
            </>
          ) : (
            <>
              {isSignup ? "Create account" : "Sign in"}
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-stone-500">
        {isSignup ? "Already have an account?" : "New to PairScope?"}{" "}
        <Link
          to={isSignup ? "/login" : "/signup"}
          className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:text-orange-800"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
