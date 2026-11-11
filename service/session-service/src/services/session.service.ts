import { ISessionRepository } from "@/interfaces/session.interface";
import { CreateSessionDTO } from "@/validators/session.validator";

export class SessionService {
    constructor(private readonly repo: ISessionRepository) {}

    async create(dto: CreateSessionDTO, userId: string): Promise<void> {
        
    }
}
