import type { ISessionInvitations } from "@/models/invitation.model";

export type InvitationRecord = ISessionInvitations & { id: string; expiresAt: Date };

export interface IInvitationRepository {
    createInvite(invite: ISessionInvitations & { expiresAt: Date }): Promise<InvitationRecord>;
    acceptInvite(invitationId: string, userId: string | null): Promise<void>;
    findInviteByToken(tokenHash: string): Promise<InvitationRecord | null>;
}
