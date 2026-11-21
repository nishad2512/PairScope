import * as jwt from "jsonwebtoken";
import { config } from "@/config/env";
import { RealtimeSocket } from "@/types/socket.types";
import { accessTokenSchema } from "@/validators/auth.validator";
import { SocketCode } from "@/utils/StatusEnum";

export const socketAuthMiddleware = (
    socket: RealtimeSocket,
    next: (error?: Error) => void,
): void => {
    try {
        const token: unknown =
            socket.handshake.auth?.token ??
            socket.handshake.headers.authorization?.replace(/^Bearer /, "");

        if (typeof token !== "string" || token.length > 8192) {
            throw new Error("Missing token");
        }

        const payload = accessTokenSchema.parse(
            jwt.verify(token, config.ACCESS_SECRET, { algorithms: ["HS256"] }),
        );

        socket.data.identity = {
            userId: payload.userId,
            sessionId: payload.sessionId,
            expiresAt: payload.exp * 1000,
        };

        next();
    } catch {
        const error = new Error(
            "A valid access token is required.",
        ) as Error & { data: { code: SocketCode } };
        error.data = { code: SocketCode.Unauthorized };

        next(error);
    }
};
