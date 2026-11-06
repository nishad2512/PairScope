import { apiRequest } from "@/lib/api-client";
import type {
  AuthResponse,
  LoginPayload,
  SignupPayload,
} from "@/types/auth";

export const authService = {
  signup(payload: SignupPayload) {
    return apiRequest<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
