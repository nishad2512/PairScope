import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { IOrg, IOrgRepository } from "../interfaces/org.interface";
import { orgs } from "../models/organization.model";
import { injectable } from "tsyringe";
import { Transaction } from "@/types/database.types";

@injectable()
export class OrgRepository implements IOrgRepository {
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
        const [org] = await db.select().from(orgs).where(eq(orgs.id, orgId));

        return org || null;
    }

    async getOrgBySlug(slug: string): Promise<IOrg | null> {
        const [org] = await db.select().from(orgs).where(eq(orgs.slug, slug));

        return org || null;
    }

    async getOrgsByOwner(
        ownerId: string,
    ): Promise<(IOrg)[]> {
        return await db.select().from(orgs).where(eq(orgs.ownerId, ownerId));
    }
}
