import { ZodError } from "zod";
import { ErrorCode, RealtimeError } from "../types/events";

export class SocketError extends Error {
    constructor(
        public readonly code: ErrorCode,
        message: string,
    ) {
        super(message);
        this.name = "SocketError";
    }
}

export const publicError = (error: unknown): RealtimeError => {
    if (error instanceof SocketError) {
        return { code: error.code, message: error.message };
    }

    if (error instanceof ZodError) {
        return { code: "INVALID_PAYLOAD", message: "The event payload is invalid." };
    }

    return {
        code: "SERVICE_UNAVAILABLE",
        message: "Realtime is temporarily unavailable. Please retry.",
    };
};
