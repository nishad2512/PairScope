import { StatusCode } from "../utils/StatusEnum";
import { accessResponseSchema } from "../validator/access.validator";
import { config } from "../config";
import { Identity, SessionAccess } from "../types/events";
import { SocketError } from "../utils/errors";

export const authorizeSession = async (
    sessionId: string,
    identity: Identity,
): Promise<SessionAccess> => {
    if (identity.sessionId && identity.sessionId !== sessionId) {
        throw new SocketError(
            "FORBIDDEN",
            "This guest token belongs to another session.",
        );
    }

    const response = await fetch(
        new URL("/internal/realtime/authorize", config.SESSION_SERVICE_URL),
        {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-internal-secret": config.INTERNAL_SERVICE_SECRET,
            },
            body: JSON.stringify({
                sessionId,
                userId: identity.userId,
                guest: !!identity.sessionId,
            }),
            signal: AbortSignal.timeout(3000),
        },
    );

    if (response.status === StatusCode.Conflict) {
        throw new SocketError(
            "SESSION_CLOSED",
            "This session is no longer available.",
        );
    }

    if (
        response.status === StatusCode.Forbidden ||
        response.status === StatusCode.NotFound
    ) {
        throw new SocketError(
            "FORBIDDEN",
            "You are not a participant in this session.",
        );
    }

    if (!response.ok) {
        throw new SocketError(
            "SERVICE_UNAVAILABLE",
            "Session access could not be verified. Please retry.",
        );
    }

    const result = accessResponseSchema.parse(await response.json()).data;
    if (
        result.sessionId !== sessionId ||
        (identity.sessionId
            ? result.participant.id !== identity.userId ||
              result.participant.userId !== null
            : result.participant.userId !== identity.userId)
    ) {
        throw new SocketError(
            "FORBIDDEN",
            "The participant does not match this connection.",
        );
    }

    return result;
};
