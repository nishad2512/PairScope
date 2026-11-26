import { IAuthService } from "@/interfaces/auth.interface";
import {
    IMemberRepository,
    IMemberService,
    IOrgMember,
    MemberProfile,
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
        @inject("IAuthService") private readonly auth: IAuthService,
    ) {}

    private async withProfiles(
        members: IOrgMember[],
    ): Promise<MemberProfile[]> {
        try {
            const profiles = await this.auth.getUserProfiles(
                members.map((member) => member.userId),
            );
            const byId = new Map(
                profiles.map((profile) => [profile.id, profile]),
            );
            return members.map((member) => ({
                ...member,
                displayName:
                    byId.get(member.userId)?.displayName || "Name unavailable",
                avatarUrl: byId.get(member.userId)?.avatarUrl || null,
            }));
        } catch {
            console.error("Member profiles are temporarily unavailable");
            return members.map((member) => ({
                ...member,
                displayName: "Name unavailable",
                avatarUrl: null,
            }));
        }
    }

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
    ): Promise<MemberProfile[]> {
        await this.authorize(orgId, userId);
        return this.withProfiles(await this.memRepo.getMembersByOrg(orgId));
    }

    async getMemberById(
        memId: string,
        orgId: string,
        userId: string,
    ): Promise<MemberProfile> {
        await this.authorize(orgId, userId);
        orgIdSchema.parse(memId);
        const member = await this.memRepo.getMemberById(memId, orgId);
        if (!member?.isActive)
            throw new AppError(StatusCode.NotFound, "Member not found");
        return (await this.withProfiles([member]))[0]!;
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
