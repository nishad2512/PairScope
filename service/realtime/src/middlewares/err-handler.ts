import { ZodError } from "zod";
import AppError from "@/utils/AppError";
import { SocketCode } from "@/utils/StatusEnum";
import { Ack, IRealtimeError, RealtimeSocket } from "@/types/socket.types";

export const getSocketError = (error: unknown): IRealtimeError => {
    if (error instanceof AppError) {
        return { code: error.statusCode, message: error.message };
    }

    if (error instanceof ZodError) {
        return {
            code: SocketCode.InvalidPayload,
            message: "The event payload is invalid.",
        };
    }

    return {
        code: SocketCode.ServiceUnavailable,
        message: "Realtime is temporarily unavailable. Please retry.",
    };
};

const errHandler = <T>(
    error: unknown,
    socket: RealtimeSocket,
    ack?: Ack<T>,
): void => {
    const result = getSocketError(error);

    if (typeof ack === "function") {
        ack({ ok: false, error: result });
        return;
    }

    socket.emit("session:error", result);
};

export default errHandler;
