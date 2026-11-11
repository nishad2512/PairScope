import { db } from "@/config/db";
import { ISessionRepository } from "@/interfaces/session.interface";
import { ParticipantRepository } from "@/repositories/participant.repository";
import { CreateSessionDTO } from "@/validators/session.validator";
import { inject, injectable } from "tsyringe";

@injectable()
export class SessionService {
    constructor(
        @inject("ISessionRepository") private readonly repo: ISessionRepository,
        private readonly participantRepo: ParticipantRepository,
    ) {}

    async create(dto: CreateSessionDTO, userId: string) {
        const scheduledAt = dto.scheduledAt ?? null;
        const status = scheduledAt ? "SCHEDULED" : "LIVE";
        const startedAt = status === "LIVE" ? new Date() : null;

        return await db.transaction(async (tx) => {
            const session = await this.repo.createSession(tx, {
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

            const participant = await this.participantRepo.createParticipant(
                tx,
                {
                    sessionId: session.id!,
                    userId,
                    displayName: "creator",
                    role: "OWNER",
                },
            );
            return { session, participant };
        });
    }
}
