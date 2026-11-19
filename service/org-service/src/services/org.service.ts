import { inject, injectable } from "tsyringe";
import { IOrg, IOrgRepository, IOrgService } from "../interfaces/org.interface";
import { CreateOrgDTO } from "../validators/org.validator";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

@injectable()
export class OrgService implements IOrgService {
    constructor(
        @inject("IOrgRepository") private readonly repo: IOrgRepository,
    ) {}

    async create(dto: CreateOrgDTO, ownerId: string): Promise<IOrg> {
        const dublicate = await this.repo.getOrgBySlug(dto.slug);
        if (dublicate) {
            throw new AppError(
                StatusCode.Conflict,
                "Organization with same slug exists",
            );
        }
        
        return await this.repo.create({ ...dto, ownerId });
    }

    async getOrgs(ownerId: string): Promise<IOrg[]> {
        return await this.repo.getOrgsByOwner(ownerId);
    }

    async getOrgById(orgId: string): Promise<IOrg> {
        const org = await this.repo.getOrgById(orgId);

        if (!org) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid Organization Credentials",
            );
        }

        return org;
    }

    async getOrgBySlug(slug: string): Promise<IOrg> {
        const org = await this.repo.getOrgBySlug(slug);

        if (!org) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid Organization Credentials",
            );
        }

        return org;
    }
}
