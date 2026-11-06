import { CheckCircle2 } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthSectionOne } from "@/components/ui/auth-section-1";
import { useAuth } from "@/hooks/use-auth";

type AuthPageProps = {
  mode: "login" | "signup";
};

export function AuthPage({ mode }: AuthPageProps) {
  const auth = useAuth();

  if (auth.session) {
    return (
      <AuthSectionOne>
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
          role="status"
        >
          <CheckCircle2 className="mb-4 text-emerald-700" size={30} />
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            {mode === "signup" ? "You’re all set." : "Welcome back."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Signed in as{" "}
            <span className="font-medium text-stone-900">
              {auth.session.user.displayName || auth.session.user.email}
            </span>
            . Your account is ready.
          </p>
        </div>
      </AuthSectionOne>
    );
  }

  return (
    <AuthSectionOne>
      <AuthForm
        mode={mode}
        isSubmitting={auth.isSubmitting}
        error={auth.error}
        onLogin={auth.logIn}
        onSignup={auth.signUp}
        onClearError={auth.clearError}
      />
    </AuthSectionOne>
  );
}
