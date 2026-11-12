export type SessionStatus = "scheduled" | "live" | "completed" | "cancelled" | "expired";
export type SessionType = "INTERVIEW" | "COLLABORATION";
export type InviteRole = "INTERVIEWER" | "CANDIDATE" | "COLLABORATOR" | "OBSERVER";

export type Session = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  sessionType: Lowercase<SessionType>;
  status: SessionStatus;
  ownerId: string;
  createdAt: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  expiresAt: string | null;
};

export type CreateSession = {
  title: string;
  description: string | null;
  language: string;
  sessionType: SessionType;
  scheduledAt: string | null;
  expiresAt: string | null;
};

export type Invitation = {
  token: string;
  invitation: { expiresAt: string };
};

export type InvitationAcceptance =
  | { sessionId: string }
  | { result: { sessionId: string; role: InviteRole }; data: { token: string } };
