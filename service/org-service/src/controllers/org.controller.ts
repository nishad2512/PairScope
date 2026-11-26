import { IOrgController, IOrgService } from "@/interfaces/org.interface";
import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import { StatusCode } from "@/utils/StatusEnum";
import AppError from "@/utils/AppError";

@injectable()
export class OrgController implements IOrgController {
    constructor(@inject("IOrgService") private readonly serv: IOrgService) {}

    async create(req: Request, res: Response): Promise<void> {
        const ownerId = req.user!.userId;
        const result = await this.serv.create(req.body, ownerId);

        res.status(StatusCode.Created).json({ data: result });
    }

    async getUserOrgs(req: Request, res: Response): Promise<void> {
        const ownerId = req.user!.userId;
        const result = await this.serv.getOrgs(ownerId);

        res.status(StatusCode.Ok).json({ data: result });
    }

    async getOrgById(req: Request, res: Response): Promise<void> {
        const orgId = req.params.orgId as string;
        const result = await this.serv.getOrgById(orgId, req.user!.userId);

        res.status(StatusCode.Ok).json({ data: result });
    }

    async getOrgBySlug(req: Request, res: Response): Promise<void> {
        const slug = req.headers["x-org-subdomain"] as string | undefined;
        if (!slug) {
            throw new AppError(
                StatusCode.BadRequest,
                "Organization credentials not found",
            );
        }

        const result = await this.serv.getOrgBySlug(slug, req.user!.userId);

        res.status(StatusCode.Ok).json({ data: result });
    }
}
