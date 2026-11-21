import { ZodType } from "zod";
import { isRedisReady } from "@/config/redis";
import { Ack, RealtimeSocket } from "@/types/socket.types";
import AppError from "@/utils/AppError";
import { SocketCode } from "@/utils/StatusEnum";
import errHandler from "@/middlewares/err-handler";
import validate from "@/middlewares/validation";

export class EventMiddleware {
    private queue = Promise.resolve();
    private pending = 0;
    private windowStart = Date.now();
    private events = 0;
    private presenceEvents = 0;

    constructor(private readonly socket: RealtimeSocket) {}

    handle<T, R>(
        schema: ZodType<T>,
        payload: unknown,
        ack: Ack<R> | undefined,
        handler: (dto: T) => Promise<R>,
        isPresence = false,
    ): void {
        if (Date.now() - this.windowStart >= 1000) {
            this.windowStart = Date.now();
            this.events = 0;
            this.presenceEvents = 0;
        }

        this.events++;
        if (isPresence) {
            this.presenceEvents++;
        }

        if (
            this.events > 100 ||
            (isPresence && this.presenceEvents > 20) ||
            this.pending >= 32
        ) {
            errHandler(
                new AppError(
                    SocketCode.RateLimited,
                    "Too many realtime events. Please slow down.",
                ),
                this.socket,
                ack,
            );
            return;
        }

        this.pending++;
        this.queue = this.queue.then(async () => {
            try {
                if (
                    !this.socket.connected ||
                    this.socket.data.identity.expiresAt <= Date.now()
                ) {
                    throw new AppError(
                        SocketCode.Unauthorized,
                        "Your access token has expired. Reconnect with a fresh token.",
                    );
                }

                if (!isRedisReady()) {
                    throw new AppError(
                        SocketCode.ServiceUnavailable,
                        "Realtime storage is unavailable. Please retry.",
                    );
                }

                const dto = validate(schema, payload);
                const data = await handler(dto);

                if (typeof ack === "function") {
                    ack({ ok: true, data });
                }
            } catch (error) {
                errHandler(error, this.socket, ack);
            } finally {
                this.pending--;
            }
        });
    }
}
