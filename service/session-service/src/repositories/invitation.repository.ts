import { db } from "@/config/db";
import { invitations } from "@/models/invitation.model";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

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
}
