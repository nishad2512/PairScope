import { injectable } from "tsyringe";
import { config } from "@/config/env";
import {
    IIdentity,
    ISessionAccess,
    ISessionService,
} from "@/interfaces/session.interface";
import { sessionResponseSchema } from "@/validators/session.validator";
import AppError from "@/utils/AppError";
import { SocketCode } from "@/utils/StatusEnum";

@injectable()
export class SessionService implements ISessionService {
    async authorize(
        sessionId: string,
        identity: IIdentity,
    ): Promise<ISessionAccess> {
        if (identity.sessionId && identity.sessionId !== sessionId) {
            throw new AppError(
                SocketCode.Forbidden,
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

        if (response.status === 409) {
            throw new AppError(
                SocketCode.SessionClosed,
                "This session is no longer available.",
            );
        }

        if (response.status === 403 || response.status === 404) {
            throw new AppError(
                SocketCode.Forbidden,
                "You are not a participant in this session.",
            );
        }

        if (!response.ok) {
            throw new AppError(
                SocketCode.ServiceUnavailable,
                "Session access could not be verified. Please retry.",
            );
        }

        const body = sessionResponseSchema.parse(await response.json());
        const access = body.data;
        const participant = access.participant;
        const invalidParticipant = identity.sessionId
            ? participant.id !== identity.userId || participant.userId !== null
            : participant.userId !== identity.userId;

        if (access.sessionId !== sessionId || invalidParticipant) {
            throw new AppError(
                SocketCode.Forbidden,
                "The participant does not match this connection.",
            );
        }

        return access;
    }
}
