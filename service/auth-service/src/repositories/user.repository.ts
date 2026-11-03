import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { IUserRepo } from "../interfaces/user.interface";
import { IUser, users } from "../models/user.model";
import { injectable } from "tsyringe";

@injectable()
export class UserRepository implements IUserRepo {
    async createUser(user: IUser): Promise<void> {
        await db.insert(users).values(user);
    }

    async getUserById(id: string): Promise<IUser | null> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async getUserByEmail(email: string): Promise<IUser | null> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async updateUser(id: string, user: any): Promise<void> {
        await db.update(users).set(user).where(eq(users.id, id));
    }

    async deleteUser(id: string): Promise<void> {
        await db.delete(users).where(eq(users.id, id));
    }
}
