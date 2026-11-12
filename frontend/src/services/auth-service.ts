import { ApiError, apiRequest } from "@/lib/api-client";
import type { AuthResponse, AuthUser, LoginPayload, SignupPayload } from "@/types/auth";

let accessToken: string | null = null;
let refreshRequest: Promise<string> | null = null;
let onExpired = () => {};

function withCookieLock<T>(request: () => Promise<T>) {
  return navigator.locks ? navigator.locks.request("pairscope-auth", request) : request();
}

function refresh() {
  refreshRequest ??= withCookieLock(async () => {
    try {
      const response = await apiRequest<Pick<AuthResponse, "accessToken">>("/auth/refresh", {
        method: "POST",
      });
      accessToken = response.accessToken;
      return accessToken;
    } catch (error) {
      if (error instanceof ApiError && [400, 401, 403].includes(error.status)) {
        accessToken = null;
        onExpired();
        throw new ApiError("Your sign-in has expired. Please sign in again.", 401);
      }
      throw error;
    }
  }).finally(() => { refreshRequest = null; });
  return refreshRequest;
}

export async function authenticatedRequest<T>(path: string, init: RequestInit = {}) {
  function send(token: string) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return apiRequest<T>(path, { ...init, headers });
  }

  const token = accessToken ?? await refresh();
  try {
    return await send(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    return send(accessToken && accessToken !== token ? accessToken : await refresh());
  }
}

function authenticate(path: string, payload: LoginPayload | SignupPayload) {
  return withCookieLock(async () => {
    const response = await apiRequest<AuthResponse>(path, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    accessToken = response.accessToken;
    return response.user;
  });
}

export const authService = {
  signup: (payload: SignupPayload) => authenticate("/auth/signup", payload),
  login: (payload: LoginPayload) => authenticate("/auth/login", payload),

  async restore() {
    const { user } = await authenticatedRequest<{ user: AuthUser }>("/user/me");
    return user;
  },

  async logout() {
    try {
      await authenticatedRequest("/user/logout", { method: "POST" });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
    }
    accessToken = null;
  },

  onExpired(callback: () => void) {
    onExpired = callback;
    return () => { onExpired = () => {}; };
  },

  currentUserId(): string | undefined {
    // This claim only controls which UI actions are shown.
    try {
      const payload = accessToken?.split(".")[1];
      if (payload) {
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof decoded.userId === "string" ? decoded.userId : undefined;
      }
    } catch {
      return undefined;
    }
    return undefined;
  },
};
