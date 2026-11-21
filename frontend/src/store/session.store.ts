import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Participant } from "../types/api.types";

interface GuestAccess {
    sessionId: string;
    token: string;
    invitationToken: string;
    participant: Participant;
}

interface SessionState {
    guestAccess: GuestAccess | null;
    setGuestAccess: (access: GuestAccess) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            guestAccess: null,
            setGuestAccess: (guestAccess) => set({ guestAccess }),
        }),
        { name: "pairscope:guest-session", storage: createJSONStorage(() => sessionStorage) },
    ),
);
