import { container } from "tsyringe";
import { IUserRepo } from "../interfaces/repo.interface";
import { UserRepository } from "../repositories/user.repository";

container.registerSingleton<IUserRepo>('IUserRepo', UserRepository);