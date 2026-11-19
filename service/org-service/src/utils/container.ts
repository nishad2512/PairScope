import { OrgController } from "@/controllers/org.controller";
import { IOrgController, IOrgRepository, IOrgService } from "@/interfaces/org.interface";
import { OrgRepository } from "@/repositories/org.repository";
import { OrgService } from "@/services/org.service";
import { container } from "tsyringe";

container.registerSingleton<IOrgRepository>("IOrgRepository", OrgRepository);
container.registerSingleton<IOrgService>("IOrgService", OrgService);
container.registerSingleton<IOrgController>("IOrgController", OrgController);