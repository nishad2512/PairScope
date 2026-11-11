import { Request, Response } from "express";
import { SessionService } from "@/services/session.service";
import { inject, injectable } from "tsyringe";
import { StatusCode } from "@/utils/StatusEnum";

@injectable()
export class SessionController {
    constructor(
        @inject("SessionService") private readonly service: SessionService,
    ) {}

    public create = async (req: Request, res: Response): Promise<void> => {
        const { session, participant } = await this.service.create(
            req.body,
            req.user!.userId,
        );

        res.status(StatusCode.Created).json({
            data: {
                id: session.id,
                title: session.title,
                language: session.language,
                status: session.status.toLowerCase(),
                ownerId: session.creatorId,
                createdAt: session.createdAt,
                scheduledAt: session.scheduledAt ?? null,
                startedAt: session.startedAt ?? null,
                expiresAt: session.expiresAt ?? null,
                participantId: participant.id,
                participantDisplayName: participant.displayName,
                participantRole: participant.role.toLowerCase(),
            },
        });
    };
}
