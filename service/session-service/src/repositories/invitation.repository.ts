import { db } from "@/config/db";
import { invitations } from "@/models/invitation.model";
import { Transaction } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { eq } from "drizzle-orm";

export class InvitationRepository {
    async createInvite(invite: typeof invitations.$inferInsert) {
        const [newInvite] = await db
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

    async findInviteByToken(tx: Transaction, tokenHash: string) {
        const [invite] = await tx
            .select()
            .from(invitations)
            .where(eq(invitations.tokenHash, tokenHash));

        return invite;
    }
}
