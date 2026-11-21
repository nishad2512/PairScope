import { container } from "tsyringe";
import { SessionController } from "@/controllers/session.controller";
import {
    IDocumentService,
    IRealtimeRepository,
    IRealtimeService,
} from "@/interfaces/realtime.interface";
import { ISessionService } from "@/interfaces/session.interface";
import { RealtimeRepository } from "@/repositories/realtime.repository";
import { DocumentService } from "@/services/document.service";
import { RealtimeService } from "@/services/realtime.service";
import { SessionService } from "@/services/session.service";

container.registerSingleton<IRealtimeRepository>(
    "IRealtimeRepository",
    RealtimeRepository,
);
container.registerSingleton<ISessionService>("ISessionService", SessionService);
container.registerSingleton<IDocumentService>(
    "IDocumentService",
    DocumentService,
);
container.registerSingleton<IRealtimeService>(
    "IRealtimeService",
    RealtimeService,
);
container.registerSingleton("SessionController", SessionController);
