import { container } from "tsyringe";
import { IUserRepo } from "../interfaces/user.interface";
import { UserRepository } from "../repositories/user.repository";
import {
    IRefreshRepository,
    ITokenService,
} from "@/interfaces/refresh.interface";
import { RefreshRepository } from "@/repositories/refresh.repository";
import { TokenService } from "@/services/token.service";
import { UserService } from "@/services/user.service";
import { AuthController } from "@/controllers/auth.controller";

container.registerSingleton<IUserRepo>("IUserRepo", UserRepository);
container.registerSingleton<IRefreshRepository>(
    "IRefreshRepository",
    RefreshRepository,
);
container.registerSingleton<ITokenService>("ITokenService", TokenService);
container.registerSingleton("UserService", UserService);
container.registerSingleton("AuthController", AuthController);
