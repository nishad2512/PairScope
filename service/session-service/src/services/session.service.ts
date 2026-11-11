import { db } from "@/config/db";
import createGrpcClient from "@/grpc/client";
import { InvitationRepository } from "@/repositories/invitation.repository";
import { ParticipantRepository } from "@/repositories/participant.repository";
import { SessionRepository } from "@/repositories/session.repository";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { CreateInviteDTO } from "@/validators/invite.validator";
import { CreateSessionDTO } from "@/validators/session.validator";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { inject, injectable } from "tsyringe";

const authClient = createGrpcClient(
    "proto/auth.proto",
    "auth.AuthService",
    process.env.GRPC_AUTH_URL ?? "auth-service:50051",
) as any;

const getUserData = (email: string) =>
    new Promise((resolve, reject) => {
        authClient.GetUserData({ email }, (error: any, user: any) =>
            error
                ? reject(
                      new AppError(
                          StatusCode.InternalServerError,
                          `There seems a error in getting the user`,
                      ),
                  )
                : resolve(user),
        );
    });

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
            userId = user.id;
        }

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const status = "PENDING";

        const token = randomBytes(32).toString("hex");
        const tokenHash = await bcrypt.hash(token, 12);

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
}
