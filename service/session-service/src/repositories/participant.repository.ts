import { ISessionParticipant, participants } from "@/models/participant.model";
import { Transaction } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

export class ParticipantRepository {
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
