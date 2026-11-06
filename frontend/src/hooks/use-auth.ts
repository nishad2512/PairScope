import { useState } from "react";
import { authService } from "@/services/auth-service";
import type { AuthResponse, LoginPayload, SignupPayload } from "@/types/auth";

type AuthState = {
  error: string | null;
  isSubmitting: boolean;
  session: AuthResponse | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    error: null,
    isSubmitting: false,
    session: null,
  });

  async function submit(
    request: () => Promise<AuthResponse>,
  ): Promise<void> {
    setState({ error: null, isSubmitting: true, session: null });
    try {
      const session = await request();
      setState({ error: null, isSubmitting: false, session });
    } catch (error) {
      setState({
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        isSubmitting: false,
        session: null,
      });
    }
  }

  return {
    ...state,
    signUp: (payload: SignupPayload) => submit(() => authService.signup(payload)),
    logIn: (payload: LoginPayload) => submit(() => authService.login(payload)),
    clearError: () => setState((current) => ({ ...current, error: null })),
  };
}
