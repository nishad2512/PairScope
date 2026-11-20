export interface PublicUser {
    displayName: string;
    email: string;
    role: 'user' | 'admin' | null;
    tier: string | null;
    avatar: string | null;
}

export interface AuthPayload {
    user: PublicUser;
    accessToken: string;
}

export type SessionType = 'INTERVIEW' | 'COLLABORATION';
export type InviteRole = 'INTERVIEWER' | 'CANDIDATE' | 'COLLABORATOR' | 'OBSERVER';
export type MemberRole = 'INTERVIEWER' | 'ADMIN';

export interface CreateSessionInput {
    title: string;
    description?: string | null;
    orgId?: string | null;
    sessionType: SessionType;
    language: string;
    questionId?: string | null;
    scheduledAt?: string | null;
    expiresAt?: string | null;
}

export interface SessionSummary {
    id: string;
    title: string;
    description: string | null;
    language: string;
    sessionType: string;
    status: string;
    ownerId: string;
    orgId: string | null;
    questionId: string | null;
    scheduledAt: string | null;
    startedAt: string | null;
    endedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreatedSession {
    id: string;
    title: string;
    language: string;
    status: string;
    ownerId: string;
    createdAt: string;
    scheduledAt: string | null;
    startedAt: string | null;
    expiresAt: string | null;
    participantId: string;
    participantDisplayName: string;
    participantRole: string;
}

export interface CreateInviteResponse {
    invitation: unknown;
    token: string;
}

export interface Participant {
    id: string;
    sessionId: string;
    userId: string | null;
    displayName: string;
    role: string;
}

export interface JoinResponseBody {
    data:
        | Participant
        | { result: Participant; data: { accessToken?: string } };
}

export interface Organization {
    id?: string;
    name: string;
    slug: string;
    ownerId?: string;
    createdAt?: string;
}

export interface CreatedOrg {
    org: Organization;
    member: OrgMember;
}

export interface OrgMember {
    id?: string;
    orgId?: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'INTERVIEWER';
    createdAt?: string;
}