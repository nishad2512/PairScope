import { ISessionRepository } from "@/interfaces/session.interface";
import { ISession } from "@/models/session.model";
import { CreateSessionDTO } from "@/validators/session.validator";
import { inject, injectable } from "tsyringe";

@injectable()
export class SessionService {
    constructor(@inject("ISessionRepository") private readonly repo: ISessionRepository) {}

    async create(dto: CreateSessionDTO, userId: string): Promise<ISession> {
        const scheduledAt = dto.scheduledAt ?? null;
        const status = scheduledAt ? "SCHEDULED" : "LIVE";
        const startedAt = status === "LIVE" ? new Date() : null
        
        return this.repo.createSession({
            title: dto.title,
            description: dto.description ?? null,
            creatorId: userId,
            orgId: dto.orgId ?? null,
            sessionType: dto.sessionType,
            language: dto.language,
            questionId: dto.questionId ?? null,
            scheduledAt,
            startedAt,
            status,
            expiresAt: dto.expiresAt ?? null,
        });
    }
}
