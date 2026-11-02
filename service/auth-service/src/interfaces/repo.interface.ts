import { IUser } from "../models/User";

export interface IUserRepo {
    createUser(user: IUser): Promise<void>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
    updateUser(id: string, user: any): Promise<void>;
    deleteUser(id: string): Promise<void>;
}
