import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { tryRestoreSession } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import type {
    ClientEvents,
    ConnectionStatus,
    CursorUpdate,
    JoinedSession,
    PresenceParticipant,
    RealtimeError,
    RemoteCursor,
    ServerEvents,
} from "../types/realtime.types";

interface PresenceState {
    token: string;
    sessionId: string;
    status: ConnectionStatus;
    error: string;
    selfSocketId: string;
    session: JoinedSession | null;
    participants: PresenceParticipant[];
    cursors: Record<string, RemoteCursor>;
}

function initialState(sessionId: string, token: string): PresenceState {
    return {
        sessionId,
        token,
        status: "connecting",
        error: "",
        selfSocketId: "",
        session: null,
        participants: [],
        cursors: {},
    };
}

export function useSessionPresence(sessionId: string, token: string, isGuest: boolean) {
    const [state, setState] = useState(() => initialState(sessionId, token));
    const socketRef = useRef<Socket<ServerEvents, ClientEvents> | null>(null);
    const joinedRef = useRef(false);
    const cursorRef = useRef<Pick<CursorUpdate, "cursor" | "selection">>({
        cursor: null,
    });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastRefresh = useRef(0);

    useEffect(() => {
        let active = true;
        const arriving = new Map<string, PresenceParticipant>();
        const departed = new Set<string>();
        const socket: Socket<ServerEvents, ClientEvents> = io({
            path: "/socket.io",
            auth: { token },
            autoConnect: false,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        socketRef.current = socket;
        joinedRef.current = false;

        const update = (change: Partial<PresenceState>) => {
            if (active) {
                setState((current) => ({
                    ...(current.token === token && current.sessionId === sessionId
                        ? current
                        : initialState(sessionId, token)),
                    ...change,
                }));
            }
        };

        const fail = (message: string) => {
            joinedRef.current = false;
            update({
                status: "error",
                error: message,
                participants: [],
                cursors: {},
            });
        };

        const handleError = async (error: RealtimeError) => {
            if (!active) return;
            if (
                error.code === "UNAUTHORIZED" &&
                !isGuest &&
                Date.now() - lastRefresh.current > 10_000
            ) {
                lastRefresh.current = Date.now();
                update({
                    status: "reconnecting",
                    error: "Refreshing your session…",
                });
                socket.disconnect();
                const restored = await tryRestoreSession();
                if (!active) return;
                if (!restored) {
                    fail("Your session expired. Sign in again to reconnect.");
                    return;
                }
                const nextToken = useAuthStore.getState().accessToken;
                if (nextToken === token) socket.connect();
                return;
            }
            if (
                ["UNAUTHORIZED", "FORBIDDEN", "SESSION_CLOSED", "NOT_JOINED"].includes(error.code)
            ) {
                socket.disconnect();
                fail(error.message);
                return;
            }
            update({ error: error.message });
        };

        socket.on("connect", () => {
            arriving.clear();
            departed.clear();
            update({ ...initialState(sessionId, token), status: "joining" });
            socket.timeout(5000).emit("session:join", { sessionId }, (error, result) => {
                if (!active) return;
                if (error) {
                    fail("The session did not respond. Try reconnecting.");
                    return;
                }
                if (!result.ok) {
                    fail(result.error.message);
                    return;
                }
                if (result.data.sessionId !== sessionId) return;
                joinedRef.current = true;
                update({
                    status: "connected",
                    error: "",
                    selfSocketId: socket.id || "",
                    session: result.data,
                    participants: [
                        ...new Map(
                            result.data.participants.map((peer) => [peer.socketId, peer]),
                        ).values(),
                    ],
                    cursors: {},
                });
                socket.emit("presence:update", {
                    sessionId,
                    ...cursorRef.current,
                });
            });
        });

        socket.on("session:participant-joined", (peer) => {
            if (!active || !joinedRef.current || peer.sessionId !== sessionId) return;
            setState((current) => ({
                ...current,
                participants: [
                    ...current.participants.filter((item) => item.socketId !== peer.socketId),
                    peer,
                ],
            }));
        });
        socket.on("session:participant-left", (peer) => {
            if (!active || peer.sessionId !== sessionId) return;
            departed.add(peer.socketId);
            arriving.delete(peer.socketId);
            setState((current) => {
                const cursors = { ...current.cursors };
                delete cursors[peer.socketId];
                return {
                    ...current,
                    cursors,
                    participants: current.participants.filter(
                        (item) => item.socketId !== peer.socketId,
                    ),
                };
            });
        });
        socket.on("presence:update", (cursor) => {
            if (
                !active ||
                !joinedRef.current ||
                cursor.sessionId !== sessionId ||
                cursor.socketId === socket.id
            )
                return;
            setState((current) => ({
                ...current,
                cursors: { ...current.cursors, [cursor.socketId]: cursor },
            }));
        });
        socket.on("session:error", (error) => {
            void handleError(error);
        });
        socket.on("connect_error", (error) => {
            if (error.data?.code === "UNAUTHORIZED") {
                void handleError({
                    code: "UNAUTHORIZED",
                    message: isGuest
                        ? "Your guest access expired. Reopen your invitation."
                        : error.message,
                });
                return;
            }
            fail(
                error.message === "xhr poll error" || error.message === "websocket error"
                    ? "Couldn’t reach the session. Check your connection and try again."
                    : error.message,
            );
        });
        socket.on("disconnect", () => {
            joinedRef.current = false;
            update({
                status: "disconnected",
                participants: [],
                cursors: {},
                selfSocketId: "",
            });
        });
        const onReconnect = () => update({ status: "reconnecting", error: "" });
        socket.io.on("reconnect_attempt", onReconnect);
        socket.connect();

        return () => {
            active = false;
            joinedRef.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = null;
            if (socket.connected) socket.emit("session:leave", { sessionId });
            socket.removeAllListeners();
            socket.io.off("reconnect_attempt", onReconnect);
            socket.disconnect();
            if (socketRef.current === socket) socketRef.current = null;
        };
    }, [sessionId, token, isGuest]);

    const sendCursor = useCallback(
        (value: Pick<CursorUpdate, "cursor" | "selection">) => {
            cursorRef.current = value;
            const socket = socketRef.current;
            if (!socket?.connected || !joinedRef.current) return;
            if (!value.cursor) {
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = null;
                socket.emit("presence:update", { sessionId, ...value });
            } else if (!timerRef.current) {
                timerRef.current = setTimeout(() => {
                    timerRef.current = null;
                    if (socket === socketRef.current && socket.connected && joinedRef.current) {
                        socket.emit("presence:update", {
                            sessionId,
                            ...cursorRef.current,
                        });
                    }
                }, 100);
            }
        },
        [sessionId],
    );

    const reconnect = useCallback(() => {
        setState(initialState(sessionId, token));
        socketRef.current?.disconnect().connect();
    }, [sessionId, token]);

    return {
        ...(state.sessionId === sessionId && state.token === token
            ? state
            : initialState(sessionId, token)),
        sendCursor,
        reconnect,
    };
}
