import { API_ROUTES } from '../constants/api.routes';
import { apiClient } from './client';
import type {
    CreatedSession,
    CreateInviteResponse,
    CreateSessionInput,
    InviteRole,
    JoinResponseBody,
    SessionSummary,
} from '../types/api.types';

export async function getSessions(): Promise<SessionSummary[]> {
    const body = (await apiClient.get(
        API_ROUTES.SESSIONS.BASE,
    )) as unknown as { data: SessionSummary[] };
    return body.data;
}

export async function createSession(
    input: CreateSessionInput,
): Promise<CreatedSession> {
    const body = (await apiClient.post(
        API_ROUTES.SESSIONS.BASE,
        input,
    )) as unknown as { data: CreatedSession };
    return body.data;
}

export async function createInvite(
    sessionId: string,
    input: { role: InviteRole; email?: string | null },
): Promise<CreateInviteResponse> {
    const body = (await apiClient.post(
        API_ROUTES.SESSIONS.INVITE(sessionId),
        input,
    )) as unknown as { data: CreateInviteResponse };
    return body.data;
}

export async function joinSession(
    token: string,
    name: string,
): Promise<JoinResponseBody> {
    return (await apiClient.post(
        API_ROUTES.SESSIONS.JOIN(token),
        { name },
    )) as unknown as JoinResponseBody;
}