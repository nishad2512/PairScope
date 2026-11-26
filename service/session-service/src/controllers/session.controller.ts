import { toCreatedSessionResponse, toSessionResponse } from "@/mappers/session.mapper";
import { toInvitationResponse, toJoinedInvitationResponse } from "@/mappers/invitation.mapper";
import { Request, Response } from "express";
import { ISessionService } from "@/interfaces/session.interface";
import { inject, injectable } from "tsyringe";
import { StatusCode } from "@/utils/StatusEnum";

@injectable()
export class SessionController {
    constructor(
        @inject("ISessionService") private readonly service: ISessionService,
    ) {}

    public create = async (req: Request, res: Response): Promise<void> => {
        const { session, participant } = await this.service.create(
            req.body,
            req.user!.userId,
        );

        res.status(StatusCode.Created).json({
            data: toCreatedSessionResponse(session, participant),
        });
    };

    public getAllForUser = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const sessions = await this.service.getForUser(req.user!.userId);

        res.status(StatusCode.Ok).json({
            data: sessions.map(toSessionResponse),
        });
    };

    public authorizeRealtime = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const data = await this.service.authorizeRealtime(req.body);
        res.status(StatusCode.Ok).json({ data });
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
            data: {
                invitation: toInvitationResponse(result.invitation),
                token: result.token,
                emailStatus: result.emailStatus,
            },
        });
    };

    public joinInvite = async (req: Request, res: Response): Promise<void> => {
        const token = req.params.token;
        const result = await this.service.joinInvitation(
            req.body,
            token as string,
            req.user?.sessionId ? null : req.user?.userId || null,
        );

        res.status(StatusCode.Ok).json({ data: toJoinedInvitationResponse(result) });
    };
}
