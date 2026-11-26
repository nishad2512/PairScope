import { members } from "@/models/membership.model";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "../config/db";
import { IOrg, IOrgRepository } from "../interfaces/org.interface";
import { orgs } from "../models/organization.model";
import { DatabaseExecutor, Transaction } from "@/types/database.types";

export class OrgRepository implements IOrgRepository {
    constructor(private readonly database: DatabaseExecutor = db) {}

    async create(
        org: typeof orgs.$inferInsert,
        tx: Transaction
    ): Promise<IOrg> {
        const [newOrg] = await tx.insert(orgs).values(org).returning();

        if (!newOrg) {
            throw new Error("Organization creation failed");
        }

        return newOrg;
    }

    async getOrgById(orgId: string): Promise<IOrg | null> {
        const [org] = await this.database.select().from(orgs).where(eq(orgs.id, orgId));

        return org || null;
    }

    async getOrgForUpdate(orgId: string): Promise<IOrg | null> {
        const [org] = await this.database.select().from(orgs).where(eq(orgs.id, orgId)).for("update");
        return org || null;
    }

    async getOrgBySlug(slug: string): Promise<IOrg | null> {
        const [org] = await this.database.select().from(orgs).where(eq(orgs.slug, slug));

        return org || null;
    }

    async getOrgsByOwner(
        ownerId: string,
    ): Promise<(IOrg)[]> {
        return await this.database.select().from(orgs).where(or(eq(orgs.ownerId, ownerId), inArray(orgs.id,
            this.database.select({ orgId: members.orgId }).from(members)
                .where(and(eq(members.userId, ownerId), eq(members.isActive, true))),
        )));
    }
}
