import { toMemberResponse } from "@/mappers/member.mapper";
import {
    IMemberController,
    IMemberService,
} from "@/interfaces/membership.interface";
import { StatusCode } from "@/utils/StatusEnum";
import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

@injectable()
export class MemberController implements IMemberController {
    constructor(
        @inject("IMemberService") private readonly serv: IMemberService,
    ) {}

    async getOrgMembers(req: Request, res: Response): Promise<void> {
        const orgId = req.params.orgId as string;
        const result = await this.serv.getMembersByOrg(orgId, req.user!.userId);

        res.status(StatusCode.Ok).json({ data: result.map(toMemberResponse) });
    }

    async getMemberById(req: Request, res: Response): Promise<void> {
        const { orgId, memId } = req.params;
        const result = await this.serv.getMemberById(
            memId as string,
            orgId as string,
            req.user!.userId,
        );

        res.status(StatusCode.Ok).json({ data: toMemberResponse(result) });
    }

    async deleteMember(req: Request, res: Response): Promise<void> {
        const { orgId, memId } = req.params;
        await this.serv.deleteMember(memId as string, orgId as string, req.user!.userId);

        res.status(StatusCode.Ok).json({ success: true });
    }
}
