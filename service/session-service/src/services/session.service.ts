import { db } from "@/config/db";
import { InvitationRepository } from "@/repositories/invitation.repository";
import { ParticipantRepository } from "@/repositories/participant.repository";
import { SessionRepository } from "@/repositories/session.repository";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { CreateInviteDTO, JoinInviteDTO } from "@/validators/invite.validator";
import { ISession } from "@/models/session.model";
import {
    CreateSessionDTO,
    RealtimeAccessDTO,
} from "@/validators/session.validator";
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

    async authorizeRealtime(dto: RealtimeAccessDTO) {
        const session = await this.repo.getSessionById(dto.sessionId);
        const participant = dto.guest
            ? await this.participantRepo.getGuestParticipant(
                  dto.sessionId,
                  dto.userId,
              )
            : await this.participantRepo.getUserParticipant(
                  dto.sessionId,
                  dto.userId,
              );

        if (!session || !participant) {
            throw new AppError(
                StatusCode.Forbidden,
                "Session participation is required",
            );
        }

        this.checkSession(session);

        return {
            sessionId: session.id,
            language: session.language,
            status: session.status.toLowerCase(),
            expiresAt: session.expiresAt?.toISOString() ?? null,
            participant: {
                id: participant.id,
                userId: participant.userId,
                displayName: participant.displayName,
                role: participant.role,
            },
        };
    }

    async createInvitation(
        dto: CreateInviteDTO,
        invitor: string,
        sessionId: string,
    ) {
        const validId =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                sessionId,
            );
        if (!validId) {
            throw new AppError(StatusCode.BadRequest, "Invalid session ID");
        }

        const session = await this.repo.getSessionById(sessionId);
        if (!session || session.creatorId !== invitor) {
            throw new AppError(
                StatusCode.Forbidden,
                "Only the session owner can create invitations",
            );
        }

        this.checkSession(session);

        const user = dto.email ? await getUserData(dto.email) : null;
        if (dto.email && !user) {
            throw new AppError(
                StatusCode.BadRequest,
                "No registered user found for this email. Leave email blank to invite a guest.",
            );
        }

        const token = randomBytes(32).toString("hex");
        const invitation = await this.inviteRepo.createInvite({
            invitedBy: invitor,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            sessionId,
            invitedEmail: dto.email ?? null,
            role: dto.role,
            invitedUserId: user?.id ?? null,
            status: "PENDING",
            tokenHash: hashToken(token),
        });

        return { invitation, token };
    }

    async joinInvitation(
        dto: JoinInviteDTO,
        token: string,
        userId: string | null,
    ) {
        if (!/^[a-f0-9]{64}$/i.test(token)) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid invitation token",
            );
        }

        return await db.transaction(async (tx) => {
            const invite = await this.inviteRepo.findInviteByToken(
                tx,
                hashToken(token),
            );
            if (
                !invite ||
                invite.expiresAt <= new Date() ||
                ["REVOKED", "EXPIRED"].includes(invite.status)
            ) {
                throw new AppError(
                    StatusCode.BadRequest,
                    "Invitation is invalid or expired",
                );
            }

            if (invite.invitedUserId && invite.invitedUserId !== userId) {
                throw new AppError(
                    userId ? StatusCode.Forbidden : StatusCode.Unauthorized,
                    "Sign in with the account this invitation was sent to",
                );
            }

            const session = await this.repo.getSessionForUpdate(
                tx,
                invite.sessionId,
            );
            if (!session) {
                throw new AppError(StatusCode.NotFound, "Session not found");
            }

            this.checkSession(session);

            // Lock the session while checking membership so parallel joins cannot create duplicates.
            const existing = userId
                ? await this.participantRepo.getUserParticipant(
                      invite.sessionId,
                      userId,
                      tx,
                  )
                : null;

            if (invite.status === "ACCEPTED") {
                if (existing && invite.invitedUserId === userId) {
                    return existing;
                }
                throw new AppError(
                    StatusCode.Conflict,
                    "This invitation has already been accepted. Ask the owner for a new invitation.",
                );
            }

            const participant =
                existing ??
                (await this.participantRepo.createParticipant(tx, {
                    displayName: dto.name,
                    role: invite.role,
                    sessionId: invite.sessionId,
                    userId,
                    invitationId: invite.id,
                    joinedAt: new Date(),
                }));

            const data = userId
                ? null
                : await setGuestUser(
                      participant.id!,
                      invite.sessionId,
                      participant.role,
                  );
            await this.inviteRepo.acceptInvite(tx, invite.id, userId);

            return data ? { result: participant, data } : participant;
        });
    }

    private checkSession(session: ISession): void {
        if (
            !["LIVE", "SCHEDULED"].includes(session.status) ||
            (session.expiresAt && session.expiresAt <= new Date())
        ) {
            throw new AppError(
                StatusCode.Conflict,
                "Session is closed or expired",
            );
        }
    }
}
