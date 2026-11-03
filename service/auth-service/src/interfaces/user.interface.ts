import { IUser } from "../models/user.model";

export interface IUserRepo {
    createUser(user: IUser): Promise<IUser>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
    updateUser(id: string, user: any): Promise<void>;
    deleteUser(id: string): Promise<void>;
}
