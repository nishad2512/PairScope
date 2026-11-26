import { createHash, randomBytes } from "node:crypto";
import { inject, injectable } from "tsyringe";
import {
    IInvitationRepository,
    IInvitationService,
    IInvitationTransaction,
} from "@/interfaces/invitation.interface";
import { IMemberRepository } from "@/interfaces/membership.interface";
import { IOrgRepository } from "@/interfaces/org.interface";
import { IEmailPublisher } from "@/interfaces/email.interface";
import { IAuthService } from "@/interfaces/auth.interface";
import {
    CreateInvitationDTO,
    orgIdSchema,
    invitationTokenSchema,
} from "@/validators/invitation.validator";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

const hashToken = (token: string) =>
    createHash("sha256").update(token).digest("hex");

@injectable()
export class InvitationService implements IInvitationService {
    constructor(
        @inject("IInvitationRepository")
        private readonly invitations: IInvitationRepository,
        @inject("IMemberRepository")
        private readonly members: IMemberRepository,
        @inject("IOrgRepository") private readonly orgs: IOrgRepository,
        @inject("IInvitationTransaction")
        private readonly transaction: IInvitationTransaction,
        @inject("IAuthService") private readonly auth: IAuthService,
        @inject("IEmailPublisher") private readonly email: IEmailPublisher,
    ) {}

    async create(dto: CreateInvitationDTO, orgId: string, userId: string) {
        orgIdSchema.parse(orgId);
        const org = await this.orgs.getOrgById(orgId);
        const inviter = await this.members.getMemberByUser(userId, orgId);
        if (
            !org?.isActive ||
            !inviter?.isActive ||
            !["OWNER", "ADMIN"].includes(inviter.role)
        ) {
            throw new AppError(
                StatusCode.Forbidden,
                "Organization administration is required",
            );
        }
        if (dto.role === "ADMIN" && inviter.role !== "OWNER") {
            throw new AppError(
                StatusCode.Forbidden,
                "Only the owner can invite administrators",
            );
        }
        const user = await this.auth.getUserData(dto.email);
        if (!user)
            throw new AppError(
                StatusCode.BadRequest,
                "Ask this person to register before inviting them",
            );
        const existing = await this.members.getMemberByUser(user.id, orgId);
        if (existing?.isActive)
            throw new AppError(
                StatusCode.Conflict,
                "This user is already a member",
            );
        const token = randomBytes(32).toString("hex");
        const invitation = await this.invitations.create({
            orgId,
            invitedBy: userId,
            invitedUserId: user.id,
            invitedEmail: dto.email,
            tokenHash: hashToken(token),
            role: dto.role,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        let emailStatus: "queued" | "failed" = "queued";
        try {
            await this.email.publishInvitation({
                invitationId: invitation.id,
                organizationId: orgId,
                recipientEmail: dto.email,
                inviterName: "An organization administrator",
                organizationName: org.name,
                token,
                expiresAt: invitation.expiresAt,
            });
        } catch {
            console.error(
                `Could not queue organization invitation ${invitation.id}`,
            );
            emailStatus = "failed";
        }
        return { invitation, token, emailStatus };
    }

    async join(token: string, userId: string) {
        invitationTokenSchema.parse(token);
        return this.transaction.run(async ({ invitations, members, orgs }) => {
            const invitation = await invitations.findForUpdate(
                hashToken(token),
            );
            if (
                !invitation ||
                invitation.expiresAt <= new Date() ||
                invitation.status === "REVOKED"
            ) {
                throw new AppError(
                    StatusCode.BadRequest,
                    "Invitation is invalid or expired",
                );
            }
            if (invitation.invitedUserId !== userId) {
                throw new AppError(
                    StatusCode.Forbidden,
                    "Sign in with the account this invitation was sent to",
                );
            }
            const org = await orgs.getOrgForUpdate(invitation.orgId);
            const existing = await members.getMemberByUser(
                userId,
                invitation.orgId,
            );
            if (!org?.isActive)
                throw new AppError(
                    StatusCode.Forbidden,
                    "Organization is unavailable",
                );
            if (invitation.status === "ACCEPTED") {
                if (existing?.isActive) return existing;
                throw new AppError(
                    StatusCode.Conflict,
                    "Ask for a new invitation to rejoin",
                );
            }
            const inviter = await members.getMemberByUser(
                invitation.invitedBy,
                invitation.orgId,
            );
            if (
                !inviter?.isActive ||
                !["OWNER", "ADMIN"].includes(inviter.role) ||
                (invitation.role === "ADMIN" && inviter.role !== "OWNER")
            ) {
                throw new AppError(
                    StatusCode.Forbidden,
                    "The inviter can no longer grant this membership",
                );
            }
            const member = existing?.isActive
                ? existing
                : existing
                  ? await members.reactivate(existing.id, invitation.role)
                  : await members.create({
                        orgId: invitation.orgId,
                        userId,
                        role: invitation.role,
                    });
            await invitations.accept(invitation.id);
            return member;
        });
    }
}
