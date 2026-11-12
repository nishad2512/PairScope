import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { sessionService } from "@/services/session-service";
import type { Session } from "@/types/session";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    sessionService.list(controller.signal).then(
      (result) => { if (!controller.signal.aborted) setSessions(result); },
      (failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)); },
    ).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  return { sessions, loading, error, retry: () => setAttempt((value) => value + 1) };
}
