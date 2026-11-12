import { db } from "@/config/db";
import { InvitationRepository } from "@/repositories/invitation.repository";
import { ParticipantRepository } from "@/repositories/participant.repository";
import { SessionRepository } from "@/repositories/session.repository";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { CreateInviteDTO, JoinInviteDTO } from "@/validators/invite.validator";
import { CreateSessionDTO } from "@/validators/session.validator";
import { createHash, randomBytes } from "node:crypto";
import { inject, injectable } from "tsyringe";
import { getUserData, setGuestUser } from "./grpc.service";

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

@injectable()
export class SessionService {
    constructor(
        @inject("ISessionRepository") private readonly repo: SessionRepository,
        @inject("ParticipantRepository")
        private readonly participantRepo: ParticipantRepository,
        @inject("InvitationRepository")
        private readonly inviteRepo: InvitationRepository,
    ) {}

    async create(dto: CreateSessionDTO, userId: string) {
        const scheduledAt = dto.scheduledAt ?? null;
        const status = scheduledAt ? "SCHEDULED" : "LIVE";
        const startedAt = status === "LIVE" ? new Date() : null;

        return await db.transaction(async (tx) => {
            const session = await this.repo.createSession(tx, {
                title: dto.title,
                description: dto.description ?? null,
                creatorId: userId,
                orgId: dto.orgId ?? null,
                sessionType: dto.sessionType,
                language: dto.language,
                questionId: dto.questionId ?? null,
                scheduledAt,
                startedAt,
                status,
                expiresAt: dto.expiresAt ?? null,
            });

            const participant = await this.participantRepo.createParticipant(
                tx,
                {
                    sessionId: session.id!,
                    userId,
                    displayName: "creator",
                    role: "OWNER",
                },
            );
            return { session, participant };
        });
    }

    async getForUser(userId: string) {
        return this.repo.getSessionsForUser(userId);
    }

    async createInvitation(
        dto: CreateInviteDTO,
        invitor: string,
        sessionId: string,
    ) {
        let userId = null;
        if (dto.email) {
            const user = (await getUserData(dto.email)) as any;
            userId = user?.id || null;
        }

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const status = "PENDING";

        const token = randomBytes(32).toString("hex");
        const tokenHash = hashToken(token);

        const invitation = await this.inviteRepo.createInvite({
            invitedBy: invitor,
            expiresAt,
            sessionId,
            invitedEmail: dto.email,
            role: dto.role,
            invitedUserId: userId,
            status,
            tokenHash,
        });

        return { invitation, token };
    }

    async joinInvitation(dto: JoinInviteDTO, token: string, userId: string | null) {
        const tokenHash = hashToken(token);
        const result = await db.transaction(async (tx) => {
            const invite = await this.inviteRepo.findInviteByToken(
                tx,
                tokenHash,
            );

            if (!invite) {
                throw new AppError(
                    StatusCode.BadRequest,
                    "Invalid invitation token",
                );
            }

            const participant = await this.participantRepo.createParticipant(
                tx,
                {
                    displayName: dto.name,
                    role: invite?.role,
                    sessionId: invite?.sessionId,
                    userId: invite?.invitedUserId,
                },
            );

            return { ...participant };
        });

        if (!result.userId) {
            const data = await setGuestUser(
                result.id as string,
                result.sessionId,
                result.role,
            );

            console.log("auth service result: ", data);
            return { result, data };
        } else if (result.userId && !userId) {
            throw new AppError(
                StatusCode.BadRequest,
                "Registered User: please login",
            );
        }

        // validation check: whether 2 of the userId's are same or not.

        return result;
    }
}
