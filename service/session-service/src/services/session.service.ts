import { toRealtimeAccessResponse } from "@/mappers/session.mapper";
import { IInvitationRepository } from "@/interfaces/invitation.interface";
import { IParticipantRepository } from "@/interfaces/participant.interface";
import { ISessionRepository, ISessionService } from "@/interfaces/session.interface";
import { ISessionTransaction } from "@/interfaces/transaction.interface";
import { IAuthService } from "@/interfaces/auth.interface";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { CreateInviteDTO, JoinInviteDTO } from "@/validators/invite.validator";
import { ISession } from "@/models/session.model";
import { IEmailPublisher } from "@/interfaces/email.interface";
import {
    CreateSessionDTO,
    RealtimeAccessDTO,
} from "@/validators/session.validator";
import { createHash, randomBytes } from "node:crypto";
import { inject, injectable } from "tsyringe";

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

@injectable()
export class SessionService implements ISessionService {
    constructor(
        @inject("ISessionRepository") private readonly repo: ISessionRepository,
        @inject("IParticipantRepository")
        private readonly participantRepo: IParticipantRepository,
        @inject("IInvitationRepository")
        private readonly inviteRepo: IInvitationRepository,
        @inject("IEmailPublisher") private readonly emailPublisher: IEmailPublisher,
        @inject("IAuthService") private readonly auth: IAuthService,
        @inject("ISessionTransaction") private readonly transaction: ISessionTransaction,
    ) {}

    async create(dto: CreateSessionDTO, userId: string) {
        const scheduledAt = dto.scheduledAt ?? null;
        const status = scheduledAt ? "SCHEDULED" : "LIVE";
        const startedAt = status === "LIVE" ? new Date() : null;

        return await this.transaction.run(async (repositories) => {
            const session = await repositories.sessions.createSession({
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

            const participant = await repositories.participants.createParticipant(
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

        return toRealtimeAccessResponse(session, participant);
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

        const user = dto.email ? await this.auth.getUserData(dto.email) : null;
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

        let emailStatus: "not_requested" | "queued" | "failed" = "not_requested";
        if (dto.email) {
            try {
                await this.emailPublisher.publishInvitation({
                    invitationId: invitation.id,
                    sessionId,
                    recipientEmail: dto.email,
                    inviterName: "The session owner",
                    sessionTitle: session.title,
                    token,
                    expiresAt: invitation.expiresAt,
                });
                emailStatus = "queued";
            } catch {
                console.error(`Could not queue email for invitation ${invitation.id}`);
                emailStatus = "failed";
            }
        }

        return { invitation, token, emailStatus };
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

        return await this.transaction.run(async (repositories) => {
            const invite = await repositories.invitations.findInviteByToken(
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

            const session = await repositories.sessions.getSessionForUpdate(
                invite.sessionId,
            );
            if (!session) {
                throw new AppError(StatusCode.NotFound, "Session not found");
            }

            this.checkSession(session);

            // Lock the session while checking membership so parallel joins cannot create duplicates.
            const existing = userId
                ? await repositories.participants.getUserParticipant(
                      invite.sessionId,
                      userId,
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
                (await repositories.participants.createParticipant({
                    displayName: dto.name,
                    role: invite.role,
                    sessionId: invite.sessionId,
                    userId,
                    invitationId: invite.id,
                    joinedAt: new Date(),
                }));

            const data = userId
                ? null
                : await this.auth.setGuestUser(
                      participant.id!,
                      invite.sessionId,
                      participant.role,
                  );
            await repositories.invitations.acceptInvite(invite.id, userId);

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
