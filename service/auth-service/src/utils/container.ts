import { HashService } from "@/services/hash.service";
import { IHashService } from "@/interfaces/hash.interface";
import { container } from "tsyringe";
import {
    IUserRepo,
    IUserService,
    IUserLookupService,
} from "../interfaces/user.interface";
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
container.registerSingleton<IHashService>("IHashService", HashService);
container.register<IUserService>("IUserService", { useToken: "UserService" });
container.register<IUserLookupService>("IUserLookupService", {
    useToken: "UserService",
});
container.registerSingleton<ITokenService>("ITokenService", TokenService);
container.registerSingleton("UserService", UserService);
container.registerSingleton("AuthController", AuthController);
