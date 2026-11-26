import { SessionController } from "@/controllers/session.controller";
import { ISessionRepository } from "@/interfaces/session.interface";
import { SessionRepository } from "@/repositories/session.repository";
import { ParticipantRepository } from "@/repositories/participant.repository";
import { SessionService } from "@/services/session.service";
import { container } from "tsyringe";
import { InvitationRepository } from "@/repositories/invitation.repository";
import { IEmailPublisher } from "@/interfaces/email.interface";
import { EmailPublisher } from "@/messaging/email.publisher";

container.registerSingleton("ParticipantRepository", ParticipantRepository);
container.registerSingleton("InvitationRepository", InvitationRepository);
container.registerSingleton<ISessionRepository>(
    "ISessionRepository",
    SessionRepository,
);
container.registerSingleton<IEmailPublisher>("IEmailPublisher", EmailPublisher);
container.registerSingleton("SessionService", SessionService);
container.registerSingleton("SessionController", SessionController);
