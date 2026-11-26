import { db } from "@/config/db";
import {
    IMemberRepository,
    IOrgMember,
} from "@/interfaces/membership.interface";
import { members } from "@/models/membership.model";
import { DatabaseExecutor, Transaction } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { and, eq } from "drizzle-orm";

export class MemberRepository implements IMemberRepository {
    constructor(private readonly database: DatabaseExecutor = db) {}

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
        const [newMember] = await this.database.insert(members).values(member).returning();

        if (!newMember) {
            throw new AppError(
                StatusCode.InternalServerError,
                "Membership creation failed",
            );
        }

        return newMember;
    }

    async getMembersByOrg(orgId: string): Promise<IOrgMember[]> {
        const orgMembers = await this.database
            .select()
            .from(members)
            .where(and(eq(members.orgId, orgId), eq(members.isActive, true)));

        return orgMembers;
    }

    async getMemberById(
        memId: string,
        orgId: string,
    ): Promise<IOrgMember | null> {
        const [orgMember] = await this.database
            .select()
            .from(members)
            .where(and(eq(members.orgId, orgId), eq(members.id, memId)));

        return orgMember || null;
    }

    async getMemberByUser(
        userId: string,
        orgId: string,
    ): Promise<IOrgMember | null> {
        const [orgMember] = await this.database
            .select()
            .from(members)
            .where(and(eq(members.orgId, orgId), eq(members.userId, userId)));

        return orgMember || null;
    }

    async reactivate(id: string, role: IOrgMember["role"]): Promise<IOrgMember> {
        const [member] = await this.database.update(members).set({ isActive: true, role })
            .where(eq(members.id, id)).returning();
        if (!member) throw new AppError(StatusCode.NotFound, "Membership not found");
        return member;
    }

    async deleteMember(memId: string, orgId: string): Promise<void> {
        await this.database
            .update(members)
            .set({ isActive: false })
            .where(and(eq(members.orgId, orgId), eq(members.id, memId)));
    }
}
