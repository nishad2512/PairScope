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

container.registerSingleton<IOrgRepository>("IOrgRepository", OrgRepository);
container.registerSingleton<IOrgService>("IOrgService", OrgService);
container.registerSingleton<IOrgController>("IOrgController", OrgController);

// org - membership

container.registerSingleton<IMemberRepository>(
    "IMemberRepository",
    MemberRepository,
);
container.registerSingleton<IMemberService>("IMemberService", MemberService);
container.registerSingleton<IMemberController>(
    "IMemberController",
    MemberController,
);
