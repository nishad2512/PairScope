import { container } from "tsyringe";
import { SessionController } from "@/controllers/session.controller";
import { EventMiddleware } from "@/middlewares/event.middleware";
import errHandler from "@/middlewares/err-handler";
import { RealtimeServer, RealtimeSocket } from "@/types/socket.types";
import {
    documentSchema,
    messageSchema,
    presenceSchema,
    sessionSchema,
} from "@/validators/session.validator";

const controller = container.resolve(SessionController);

const registerSessionRoutes = (
    io: RealtimeServer,
    socket: RealtimeSocket,
): void => {
    const middleware = new EventMiddleware(socket);

    socket.on("session:join", (payload, ack) => {
        middleware.handle(
            sessionSchema,
            payload,
            ack,
            controller.join.bind(controller, io, socket),
        );
    });

    socket.on("session:leave", (payload, ack) => {
        middleware.handle(
            sessionSchema,
            payload,
            ack,
            controller.leave.bind(controller, io, socket),
        );
    });

    socket.on("session:message", (payload, ack) => {
        middleware.handle(
            messageSchema,
            payload,
            ack,
            controller.message.bind(controller, io, socket),
        );
    });

    socket.on("document:update", (payload, ack) => {
        middleware.handle(
            documentSchema,
            payload,
            ack,
            controller.updateDocument.bind(controller, io, socket),
        );
    });

    socket.on("presence:update", (payload, ack) => {
        middleware.handle(
            presenceSchema,
            payload,
            ack,
            controller.updatePresence.bind(controller, io, socket),
            true,
        );
    });

    socket.on("disconnecting", () => {
        controller.disconnect(io, socket).catch((error) => {
            errHandler(error, socket);
        });
    });
};

export default registerSessionRoutes;
