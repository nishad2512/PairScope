import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { ApiError, errorMessage } from "@/lib/api-client";
import { authService } from "@/services/auth-service";
import type { AuthUser } from "@/types/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState("");

  const restore = useCallback(async () => {
    setLoading(true);
    setRestoreError("");
    try {
      setUser(await authService.restore());
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        setRestoreError(errorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onExpired(() => setUser(null));
    void restore();
    return unsubscribe;
  }, [restore]);

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, restoreError, restore, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
