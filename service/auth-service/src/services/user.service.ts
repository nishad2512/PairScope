import { inject, injectable } from "tsyringe";
import { IUserRepo } from "../interfaces/user.interface";
import { LoginDTO, SignupDTO } from "@/validators/auth.validator";
import AppError from "@/utils/AppError";
import bcrypt from "bcrypt";

@injectable()
export class UserService {
    constructor(@inject('IUserRepo') private repo: IUserRepo) {};

    public async signup(dto: SignupDTO) {
        const email = dto.email.trim().toLowerCase();
        const duplicate = await this.repo.getUserByEmail(email);

        if (duplicate) {
            throw new AppError(409, "The user already exists");
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.repo.createUser({
            displayName: dto.name.trim(),
            password: passwordHash,
            email,
            role: "user",
            avatarUrl: null
        });

        
    }

    public async login(dto: LoginDTO) {
        return null;
    }
}