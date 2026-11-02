import { inject, injectable } from "tsyringe";
import { IUserRepo } from "../interfaces/repo.interface";
import { LoginDTO, SignupDTO } from "@/validators/auth.validator";

@injectable()
export class UserService {
    constructor(@inject('IUserRepo') private repo: IUserRepo) {};

    async signup(dto: SignupDTO): Promise<null> {
        return null;
    }

    async login(dto: LoginDTO): Promise<null> {
        return null;
    }
}