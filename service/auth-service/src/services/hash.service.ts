import bcrypt from "bcrypt";
import { injectable } from "tsyringe";
import { IHashService } from "@/interfaces/hash.interface";

@injectable()
export class HashService implements IHashService {
    hash(value: string): Promise<string> {
        return bcrypt.hash(value, 12);
    }
    compare(value: string, hash: string): Promise<boolean> {
        return bcrypt.compare(value, hash);
    }
}
