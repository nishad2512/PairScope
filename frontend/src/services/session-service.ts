import { apiRequest } from "@/lib/api-client";
import { authenticatedRequest } from "@/services/auth-service";
import type { CreateSession, Invitation, InvitationAcceptance, InviteRole, Session } from "@/types/session";

export const sessionService = {
  async list(signal?: AbortSignal) {
    const result = await authenticatedRequest<{ data: Session[] }>("/sessions", signal ? { signal } : {});
    return result.data;
  },

  async create(payload: CreateSession) {
    const result = await authenticatedRequest<{ data: Pick<Session, "id"> }>("/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return result.data;
  },

  async join(token: string, name: string, signedIn: boolean) {
    const request = signedIn ? authenticatedRequest : apiRequest;
    const result = await request<{ data: InvitationAcceptance }>(
      `/sessions/join/${encodeURIComponent(token)}`,
      { method: "POST", body: JSON.stringify({ name }) },
    );
    return result.data;
  },

  async invite(sessionId: string, payload: { role: InviteRole; email: string | null }) {
    const result = await authenticatedRequest<{ data: Invitation }>(
      `/sessions/${encodeURIComponent(sessionId)}/invite`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    return result.data;
  },
};
