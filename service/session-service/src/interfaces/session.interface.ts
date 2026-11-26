import type { ISessionParticipant } from "@/models/participant.model";
import type { CreateSessionDTO, RealtimeAccessDTO } from "@/validators/session.validator";
import type { CreateInviteDTO, JoinInviteDTO } from "@/validators/invite.validator";
import type { InvitationRecord } from "./invitation.interface";
import type { ISession } from "@/models/session.model";

export interface ISessionRepository {
    getSessionById(sessionId: string): Promise<ISession | null>;
    getSessionForUpdate(sessionId: string): Promise<ISession | null>;
    getSessionsForUser(userId: string): Promise<ISession[]>;
    createSession(session: ISession): Promise<ISession>;
}

export interface AccessPayload {
    userId: string;
    role?: string | null;
    sessionId?: string;
}

export interface IAuthUser {
    id: string;
    displayName: string;
    email: string;
}

export interface ISessionService {
    create(dto: CreateSessionDTO, userId: string): Promise<{
        session: ISession;
        participant: ISessionParticipant;
    }>;
    getForUser(userId: string): Promise<ISession[]>;
    authorizeRealtime(dto: RealtimeAccessDTO): Promise<{
        sessionId?: string;
        language: string;
        status: string;
        expiresAt: string | null;
        participant: Pick<ISessionParticipant, "id" | "userId" | "displayName" | "role">;
    }>;
    createInvitation(dto: CreateInviteDTO, invitor: string, sessionId: string): Promise<{
        invitation: InvitationRecord;
        token: string;
        emailStatus: "not_requested" | "queued" | "failed";
    }>;
    joinInvitation(dto: JoinInviteDTO, token: string, userId: string | null): Promise<
        ISessionParticipant | { result: ISessionParticipant; data: { token: string } }
    >;
}
