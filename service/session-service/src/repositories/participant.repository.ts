import { IParticipantRepository } from "@/interfaces/participant.interface";
import { ISessionParticipant, participants } from "@/models/participant.model";
import { DatabaseExecutor } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { db } from "@/config/db";
import { and, eq, isNull } from "drizzle-orm";

export class ParticipantRepository implements IParticipantRepository {
    constructor(private readonly database: DatabaseExecutor = db) {}

    async getUserParticipant(
        sessionId: string,
        userId: string,
    ): Promise<ISessionParticipant | null> {
        const [participant] = await this.database
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
        const [participant] = await this.database
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
        participant: ISessionParticipant,
    ): Promise<ISessionParticipant> {
        const [newParticipant] = await this.database
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
