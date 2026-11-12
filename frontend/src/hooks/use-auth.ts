import { createContext, useContext } from "react";
import type { AuthUser } from "@/types/auth";

export const AuthContext = createContext<{
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  loading: boolean;
  restoreError: string;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used within AuthProvider");
  return auth;
}
