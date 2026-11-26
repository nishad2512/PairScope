import type { invitations } from "@/models/invitation.model";
import type { CreateInvitationDTO } from "@/validators/invitation.validator";
import type { IOrgMember, IMemberRepository } from "./membership.interface";
import type { IOrgRepository } from "./org.interface";

export type OrgInvitation = typeof invitations.$inferSelect;
export interface IInvitationRepository {
    create(invitation: typeof invitations.$inferInsert): Promise<OrgInvitation>;
    findForUpdate(tokenHash: string): Promise<OrgInvitation | null>;
    accept(id: string): Promise<void>;
}
export interface IInvitationTransaction {
    run<T>(
        action: (repositories: {
            invitations: IInvitationRepository;
            members: IMemberRepository;
            orgs: IOrgRepository;
        }) => Promise<T>,
    ): Promise<T>;
}
export interface IInvitationService {
    create(
        dto: CreateInvitationDTO,
        orgId: string,
        userId: string,
    ): Promise<{
        invitation: OrgInvitation;
        token: string;
        emailStatus: "queued" | "failed";
    }>;
    join(token: string, userId: string): Promise<IOrgMember>;
}
