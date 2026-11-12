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

    public getAllForUser = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const sessions = await this.service.getForUser(req.user!.userId);

        res.status(StatusCode.Ok).json({
            data: sessions.map((session) => ({
                id: session.id,
                title: session.title,
                description: session.description,
                language: session.language,
                sessionType: session.sessionType.toLowerCase(),
                status: session.status.toLowerCase(),
                ownerId: session.creatorId,
                orgId: session.orgId,
                questionId: session.questionId,
                scheduledAt: session.scheduledAt ?? null,
                startedAt: session.startedAt ?? null,
                endedAt: session.endedAt ?? null,
                expiresAt: session.expiresAt ?? null,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            })),
        });
    };

    public createInvite = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const userId = req.user!.userId;
        const sessionId = req.params.sessionId;

        const result = await this.service.createInvitation(
            req.body,
            userId,
            sessionId as string,
        );

        res.status(StatusCode.Created).json({
            data: result,
        });
    };

    public joinInvite = async (req: Request, res: Response): Promise<void> => {
        const token = req.params.token;
        const result = await this.service.joinInvitation(
            req.body,
            token as string,
        );

        res.status(StatusCode.Ok).json({ data: result });
    };
}
