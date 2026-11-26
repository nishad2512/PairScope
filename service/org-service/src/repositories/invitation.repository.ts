import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { DatabaseExecutor } from "@/types/database.types";
import { invitations } from "@/models/invitation.model";
import { IInvitationRepository } from "@/interfaces/invitation.interface";

export class InvitationRepository implements IInvitationRepository {
    constructor(private readonly database: DatabaseExecutor = db) {}

    async create(invitation: typeof invitations.$inferInsert) {
        const [created] = await this.database.insert(invitations).values(invitation).returning();
        if (!created) throw new Error("Invitation creation failed");
        return created;
    }

    async findForUpdate(tokenHash: string) {
        const [invitation] = await this.database.select().from(invitations)
            .where(eq(invitations.tokenHash, tokenHash)).for("update");
        return invitation || null;
    }

    async accept(id: string): Promise<void> {
        await this.database.update(invitations).set({ status: "ACCEPTED", acceptedAt: new Date() })
            .where(eq(invitations.id, id));
    }
}
