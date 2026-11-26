import { InvitationRepository } from "@/repositories/invitation.repository";
import { InvitationTransaction } from "@/repositories/invitation-transaction";
import { AuthService } from "@/services/grpc.service";
import { EmailPublisher } from "@/messaging/email.publisher";
import { IEmailPublisher } from "@/interfaces/email.interface";
import { IInvitationService } from "@/interfaces/invitation.interface";
import { InvitationService } from "@/services/invitation.service";
import { InvitationController } from "@/controllers/invitation.controller";
import { MemberController } from "@/controllers/membership.controller";
import { OrgController } from "@/controllers/org.controller";
import {
    IMemberController,
    IMemberRepository,
    IMemberService,
} from "@/interfaces/membership.interface";
import {
    IOrgController,
    IOrgRepository,
    IOrgService,
} from "@/interfaces/org.interface";
import { MemberRepository } from "@/repositories/membership.repository";
import { OrgRepository } from "@/repositories/org.repository";
import { MemberService } from "@/services/membership.service";
import { OrgService } from "@/services/org.service";
import { container } from "tsyringe";

// organizations

container.register<IOrgRepository>("IOrgRepository", { useFactory: () => new OrgRepository() });
container.registerSingleton<IOrgService>("IOrgService", OrgService);
container.registerSingleton<IOrgController>("IOrgController", OrgController);

// org - membership

container.register<IMemberRepository>("IMemberRepository", { useFactory: () => new MemberRepository() });
container.registerSingleton<IMemberService>("IMemberService", MemberService);
container.registerSingleton<IMemberController>(
    "IMemberController",
    MemberController,
);

container.register("IInvitationRepository", { useFactory: () => new InvitationRepository() });
container.register("IInvitationTransaction", { useFactory: () => new InvitationTransaction() });
container.register("IAuthService", { useFactory: () => new AuthService() });
container.registerSingleton<IEmailPublisher>("IEmailPublisher", EmailPublisher);
container.registerSingleton<IInvitationService>("IInvitationService", InvitationService);
container.registerSingleton("InvitationController", InvitationController);
