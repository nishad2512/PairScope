import { IUser } from "../models/User";
import { RegisterInput } from "../validators/auth.validator";

export interface IUserRepo {
    createUser(user: RegisterInput): Promise<void>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
    updateUser(id: string, user: any): Promise<void>;
    deleteUser(id: string): Promise<void>;
}
