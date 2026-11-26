import { ISession } from "@/models/session.model";
import { ISessionParticipant } from "@/models/participant.model";

export function toCreatedSessionResponse(session: ISession, participant: ISessionParticipant) {
    return {
        id: session.id,
        title: session.title,
        language: session.language,
        status: session.status.toLowerCase(),
        ownerId: session.creatorId,
        createdAt: session.createdAt,
        scheduledAt: session.scheduledAt ?? null,
        startedAt: session.startedAt ?? null,
        expiresAt: session.expiresAt ?? null,
        participantId: participant.id,
        participantDisplayName: participant.displayName,
        participantRole: participant.role.toLowerCase(),
    };
}

export function toSessionResponse(session: ISession) {
    return {
        id: session.id,
        title: session.title,
        description: session.description,
        language: session.language,
        sessionType: session.sessionType.toLowerCase(),
        status: session.status.toLowerCase(),
        ownerId: session.creatorId,
        orgId: session.orgId,
        questionId: session.questionId,
        scheduledAt: session.scheduledAt ?? null,
        startedAt: session.startedAt ?? null,
        endedAt: session.endedAt ?? null,
        expiresAt: session.expiresAt ?? null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
    };
}

export function toRealtimeAccessResponse(session: ISession, participant: ISessionParticipant) {
    return {
        sessionId: session.id,
        language: session.language,
        status: session.status.toLowerCase(),
        expiresAt: session.expiresAt?.toISOString() ?? null,
        participant: {
            id: participant.id,
            userId: participant.userId,
            displayName: participant.displayName,
            role: participant.role,
        },
    };
}
