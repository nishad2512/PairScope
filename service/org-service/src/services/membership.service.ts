import {
    IMemberRepository,
    IMemberService,
    IOrgMember,
} from "@/interfaces/membership.interface";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { orgIdSchema } from "@/validators/invitation.validator";
import { inject, injectable } from "tsyringe";

@injectable()
export class MemberService implements IMemberService {
    constructor(
        @inject("IMemberRepository")
        private readonly memRepo: IMemberRepository,
    ) {}

    private async authorize(orgId: string, userId: string, manage = false) {
        orgIdSchema.parse(orgId);
        const member = await this.memRepo.getMemberByUser(userId, orgId);
        if (
            !member?.isActive ||
            (manage && !["OWNER", "ADMIN"].includes(member.role))
        ) {
            throw new AppError(
                StatusCode.Forbidden,
                "Organization membership is required for this action",
            );
        }
        return member;
    }

    async getMembersByOrg(
        orgId: string,
        userId: string,
    ): Promise<IOrgMember[]> {
        await this.authorize(orgId, userId);
        return this.memRepo.getMembersByOrg(orgId);
    }

    async getMemberById(
        memId: string,
        orgId: string,
        userId: string,
    ): Promise<IOrgMember> {
        await this.authorize(orgId, userId);
        orgIdSchema.parse(memId);
        const member = await this.memRepo.getMemberById(memId, orgId);
        if (!member?.isActive)
            throw new AppError(StatusCode.NotFound, "Member not found");
        return member;
    }

    async deleteMember(
        memId: string,
        orgId: string,
        userId: string,
    ): Promise<void> {
        const caller = await this.authorize(orgId, userId, true);
        orgIdSchema.parse(memId);
        const member = await this.memRepo.getMemberById(memId, orgId);
        if (!member?.isActive)
            throw new AppError(StatusCode.NotFound, "Member not found");
        if (
            member.role === "OWNER" ||
            (member.role === "ADMIN" && caller.role !== "OWNER")
        ) {
            throw new AppError(
                StatusCode.Forbidden,
                "Only the owner can manage administrators; the owner cannot be removed",
            );
        }
        await this.memRepo.deleteMember(memId, orgId);
    }
}
