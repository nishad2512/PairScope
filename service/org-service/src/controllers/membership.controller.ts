import {
    IMemberController,
    IMemberService,
} from "@/interfaces/membership.interface";
import { StatusCode } from "@/utils/StatusEnum";
import { Request, Response } from "express";
import { inject } from "tsyringe";

export class MemberController implements IMemberController {
    constructor(
        @inject("IMemberService") private readonly serv: IMemberService,
    ) {}

    async create(req: Request, res: Response): Promise<void> {
        const userId = req.user?.userId;
        const orgId = req.params.orgId as string;
        const result = await this.serv.create(req.body, orgId, userId);

        res.status(StatusCode.Created).json({ data: result });
    }

    async getOrgMembers(req: Request, res: Response): Promise<void> {
        const orgId = req.params.orgId as string;
        const result = await this.serv.getMembersByOrg(orgId);

        res.status(StatusCode.Ok).json({ data: result });
    }

    async getMemberById(req: Request, res: Response): Promise<void> {
        const { orgId, memId } = req.params;
        const result = await this.serv.getMemberById(
            memId as string,
            orgId as string,
        );

        res.status(StatusCode.Ok).json({ data: result });
    }

    async deleteMember(req: Request, res: Response): Promise<void> {
        const { orgId, memId } = req.params;
        await this.serv.deleteMember(memId as string, orgId as string);

        res.status(StatusCode.Ok).json({ success: true });
    }
}
