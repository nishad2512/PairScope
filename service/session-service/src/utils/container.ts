import { container } from "tsyringe";
import { SessionController } from "@/controllers/session.controller";
import { ISessionRepository, ISessionService } from "@/interfaces/session.interface";
import { IParticipantRepository } from "@/interfaces/participant.interface";
import { IInvitationRepository } from "@/interfaces/invitation.interface";
import { ISessionTransaction } from "@/interfaces/transaction.interface";
import { IAuthService } from "@/interfaces/auth.interface";
import { IEmailPublisher } from "@/interfaces/email.interface";
import { SessionRepository } from "@/repositories/session.repository";
import { ParticipantRepository } from "@/repositories/participant.repository";
import { InvitationRepository } from "@/repositories/invitation.repository";
import { SessionTransaction } from "@/repositories/session-transaction";
import { SessionService } from "@/services/session.service";
import { AuthService } from "@/services/grpc.service";
import { EmailPublisher } from "@/messaging/email.publisher";

container.register<IParticipantRepository>("IParticipantRepository", {
    useFactory: () => new ParticipantRepository(),
});
container.register<IInvitationRepository>("IInvitationRepository", {
    useFactory: () => new InvitationRepository(),
});
container.register<ISessionRepository>("ISessionRepository", {
    useFactory: () => new SessionRepository(),
});
container.register<ISessionTransaction>("ISessionTransaction", {
    useFactory: () => new SessionTransaction(),
});
container.register<IAuthService>("IAuthService", {
    useFactory: () => new AuthService(),
});
container.registerSingleton<IEmailPublisher>("IEmailPublisher", EmailPublisher);
container.registerSingleton<ISessionService>("ISessionService", SessionService);
container.registerSingleton("SessionController", SessionController);
