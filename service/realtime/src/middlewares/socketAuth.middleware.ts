import * as jwt from "jsonwebtoken";
import z from "zod";
import { config } from "../config";
import { RealtimeSocket } from "../types/events";

const accessTokenSchema = z.object({
    userId: z.uuid(),
    sessionId: z.uuid().optional(),
    exp: z.number().int().positive(),
});

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
        const error = new Error("A valid access token is required.") as Error & {
            data: { code: string };
        };
        error.data = { code: "UNAUTHORIZED" };
        next(error);
    }
};
