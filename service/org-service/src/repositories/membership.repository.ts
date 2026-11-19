import { db } from "@/config/db";
import {
    IMemberRepository,
    IOrgMember,
} from "@/interfaces/membership.interface";
import { members } from "@/models/membership.model";
import { Transaction } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { and, eq } from "drizzle-orm";
import { injectable } from "tsyringe";

@injectable()
export class MemberRepository implements IMemberRepository {
    async createTx(
        member: typeof members.$inferInsert,
        tx: Transaction,
    ): Promise<IOrgMember> {
        const [newMember] = await tx.insert(members).values(member).returning();

        if (!newMember) {
            throw new AppError(
                StatusCode.InternalServerError,
                "Membership creation failed",
            );
        }

        return newMember;
    }

    async create(member: typeof members.$inferInsert): Promise<IOrgMember> {
        const [newMember] = await db.insert(members).values(member).returning();

        if (!newMember) {
            throw new AppError(
                StatusCode.InternalServerError,
                "Membership creation failed",
            );
        }

        return newMember;
    }

    async getMembersByOrg(orgId: string): Promise<IOrgMember[]> {
        const orgMembers = await db
            .select()
            .from(members)
            .where(eq(members.orgId, orgId));

        return orgMembers;
    }

    async getMemberById(
        memId: string,
        orgId: string,
    ): Promise<IOrgMember | null> {
        const [orgMember] = await db
            .select()
            .from(members)
            .where(and(eq(members.orgId, orgId), eq(members.id, memId)));

        return orgMember || null;
    }

    async getMemberByUser(
        userId: string,
        orgId: string,
    ): Promise<IOrgMember | null> {
        const [orgMember] = await db
            .select()
            .from(members)
            .where(and(eq(members.orgId, orgId), eq(members.userId, userId)));

        return orgMember || null;
    }

    async deleteMember(memId: string, orgId: string): Promise<void> {
        await db
            .update(members)
            .set({ isActive: false })
            .where(and(eq(members.orgId, orgId), eq(members.id, memId)));
    }
}
