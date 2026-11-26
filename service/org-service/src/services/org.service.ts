import { inject, injectable } from "tsyringe";
import { IOrg, IOrgRepository, IOrgService } from "../interfaces/org.interface";
import { CreateOrgDTO } from "../validators/org.validator";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { db } from "@/config/db";
import {
    IMemberRepository,
    IOrgMember,
} from "@/interfaces/membership.interface";

const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@injectable()
export class OrgService implements IOrgService {
    constructor(
        @inject("IOrgRepository") private readonly orgRepo: IOrgRepository,
        @inject("IMemberRepository")
        private readonly membRepo: IMemberRepository,
    ) {}

    async create(
        dto: CreateOrgDTO,
        ownerId: string,
    ): Promise<{ org: IOrg; member: IOrgMember }> {
        const dublicate = await this.orgRepo.getOrgBySlug(dto.slug);
        if (dublicate) {
            throw new AppError(
                StatusCode.Conflict,
                "Organization with same slug exists",
            );
        }

        return await db.transaction(async (tx) => {
            const org = await this.orgRepo.create({ ...dto, ownerId }, tx);
            const member = await this.membRepo.createTx(
                {
                    userId: ownerId,
                    orgId: org.id,
                    role: "OWNER",
                },
                tx,
            );

            return { org, member };
        });
    }

    async getOrgs(ownerId: string): Promise<IOrg[]> {
        const isValidUuid = uuidRegex.test(ownerId);

        if (!isValidUuid) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid user credentials",
            );
        }

        return await this.orgRepo.getOrgsByOwner(ownerId);
    }

    async getOrgById(orgId: string, userId: string): Promise<IOrg> {
        const isValidUuid = uuidRegex.test(orgId);

        if (!isValidUuid) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid organization credentials",
            );
        }

        const org = await this.orgRepo.getOrgById(orgId);

        if (!org) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid Organization Credentials",
            );
        }

        const membership = await this.membRepo.getMemberByUser(userId, org.id);
        if (!org.isActive || !membership?.isActive) {
            throw new AppError(StatusCode.Forbidden, "Organization membership is required");
        }
        return org;
    }

    async getOrgBySlug(slug: string, userId: string): Promise<IOrg> {
        const org = await this.orgRepo.getOrgBySlug(slug);

        if (!org) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid Organization Credentials",
            );
        }

        const membership = await this.membRepo.getMemberByUser(userId, org.id);
        if (!org.isActive || !membership?.isActive) {
            throw new AppError(StatusCode.Forbidden, "Organization membership is required");
        }
        return org;
    }
}
