import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IInvitationService } from "@/interfaces/invitation.interface";
import { toInvitationResponse } from "@/mappers/invitation.mapper";
import { toMemberResponse } from "@/mappers/member.mapper";
import { StatusCode } from "@/utils/StatusEnum";

@injectable()
export class InvitationController {
    constructor(
        @inject("IInvitationService")
        private readonly service: IInvitationService,
    ) {}

    async create(req: Request, res: Response): Promise<void> {
        const result = await this.service.create(
            req.body,
            req.params.orgId as string,
            req.user!.userId,
        );
        res.status(StatusCode.Created).json({
            data: {
                invitation: toInvitationResponse(result.invitation),
                token: result.token,
                emailStatus: result.emailStatus,
            },
        });
    }

    async join(req: Request, res: Response): Promise<void> {
        const member = await this.service.join(
            req.params.token as string,
            req.user!.userId,
        );
        res.status(StatusCode.Ok).json({ data: toMemberResponse(member) });
    }
}
