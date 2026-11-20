export const API_ROUTES = {
    AUTH: {
        SIGNUP: '/auth/signup',
        LOGIN: '/auth/login',
        REFRESH: '/auth/refresh',
    },
    USER: {
        LOGOUT: '/user/logout',
        ME: '/user/me',
    },
    SESSIONS: {
        BASE: '/sessions',
        JOIN: (token: string) => `/sessions/join/${token}`,
        INVITE: (sessionId: string) => `/sessions/${sessionId}/invite`,
    },
    ORGANIZATIONS: {
        BASE: '/organizations',
        BY_SLUG: '/organizations/organization', // needs x-org-subdomain header
        BY_ID: (orgId: string) => `/organizations/${orgId}`,
        MEMBERS: (orgId: string) => `/organizations/${orgId}/members`,
        MEMBER: (orgId: string, memId: string) =>
            `/organizations/${orgId}/members/${memId}`,
    },
} as const;