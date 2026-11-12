import { Navigate, useLocation } from "react-router-dom";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthSectionOne } from "@/components/ui/auth-section-1";
import { useAuth } from "@/hooks/use-auth";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const destination = typeof from === "string" && /^\/(sessions(?:\/|$)|join\/)/.test(from)
    ? from
    : "/dashboard";

  if (user) return <Navigate to={destination} replace />;

  return <AuthSectionOne><AuthForm key={mode} mode={mode} /></AuthSectionOne>;
}
