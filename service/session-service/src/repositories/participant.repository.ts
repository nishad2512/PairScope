import { ISessionParticipant, participants } from "@/models/participant.model";
import { Transaction } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { db } from "@/config/db";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "tsyringe";

@injectable()
export class ParticipantRepository {
    async getUserParticipant(
        sessionId: string,
        userId: string,
        tx?: Transaction,
    ): Promise<ISessionParticipant | null> {
        const [participant] = await (tx ?? db)
            .select()
            .from(participants)
            .where(
                and(
                    eq(participants.sessionId, sessionId),
                    eq(participants.userId, userId),
                ),
            )
            .limit(1);
        return participant || null;
    }

    async getGuestParticipant(
        sessionId: string,
        participantId: string,
    ): Promise<ISessionParticipant | null> {
        const [participant] = await db
            .select()
            .from(participants)
            .where(
                and(
                    eq(participants.sessionId, sessionId),
                    eq(participants.id, participantId),
                    isNull(participants.userId),
                ),
            )
            .limit(1);
        return participant || null;
    }

    async createParticipant(
        tx: Transaction,
        participant: typeof participants.$inferInsert,
    ): Promise<ISessionParticipant> {
        const [newParticipant] = await tx
            .insert(participants)
            .values(participant)
            .returning();

        if (!newParticipant) {
            throw new AppError(
                StatusCode.InternalServerError,
                "Participant insert returned no record",
            );
        }
        return newParticipant;
    }
}
