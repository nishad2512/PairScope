import { IInvitationRepository } from "@/interfaces/invitation.interface";
import { ISessionInvitations } from "@/models/invitation.model";
import { db } from "@/config/db";
import { invitations } from "@/models/invitation.model";
import { DatabaseExecutor } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { eq } from "drizzle-orm";

export class InvitationRepository implements IInvitationRepository {
    constructor(private readonly database: DatabaseExecutor = db) {}

    async createInvite(invite: ISessionInvitations & { expiresAt: Date }) {
        const [newInvite] = await this.database
            .insert(invitations)
            .values(invite)
            .returning();

        if (!newInvite) {
            throw new AppError(
                StatusCode.InternalServerError,
                "Invitation insert returned no record",
            );
        }
        return newInvite;
    }

    async acceptInvite(
        invitationId: string,
        userId: string | null,
    ): Promise<void> {
        await this.database
            .update(invitations)
            .set({
                status: "ACCEPTED",
                acceptedAt: new Date(),
                invitedUserId: userId,
            })
            .where(eq(invitations.id, invitationId));
    }

    async findInviteByToken(tokenHash: string) {
        const [invite] = await this.database
            .select()
            .from(invitations)
            .where(eq(invitations.tokenHash, tokenHash))
            .for("update");

        return invite || null;
    }
}
