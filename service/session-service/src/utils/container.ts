import { SessionController } from "@/controllers/session.controller";
import { ISessionRepository } from "@/interfaces/session.interface";
import { SessionRepository } from "@/repositories/session.repository";
import { SessionService } from "@/services/session.service";
import { container } from "tsyringe";

container.registerSingleton<ISessionRepository>(
    "ISessionRepository",
    SessionRepository,
);
container.registerSingleton("SessionService", SessionService);
container.registerSingleton("SessionController", SessionController);
