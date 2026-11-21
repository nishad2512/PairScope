import { Eye, MessageSquare, MousePointer2, Users, Video } from "lucide-react";
import { participantColor } from "../../lib/presence";
import { readable } from "../../lib/format";
import type {
    ConnectionStatus,
    PresenceParticipant,
    RemoteCursor,
} from "../../types/realtime.types";

export default function ParticipantsPanel({
    participants,
    cursors,
    selfSocketId,
    status,
}: {
    participants: PresenceParticipant[];
    cursors: Record<string, RemoteCursor>;
    selfSocketId: string;
    status: ConnectionStatus;
}) {
    return (
        <aside className="editor-people" id="session-people" aria-label="Session participants">
            <div className="people-tabs">
                <span>
                    <Users size={16} />
                    People <b>{participants.length}</b>
                </span>
                <button
                    disabled
                    title="Chat is not enabled in this workspace yet."
                    aria-label="Chat, coming soon"
                >
                    <MessageSquare size={16} />
                </button>
                <button
                    disabled
                    title="Video calls are not available yet."
                    aria-label="Video call, coming soon"
                >
                    <Video size={17} />
                </button>
            </div>
            <div className="people-body">
                <div className="people-section-label">
                    <span>IN THIS SESSION</span>
                    <span>{status === "connected" ? "Live" : "Offline"}</span>
                </div>
                {participants.length ? (
                    <ul>
                        {[...participants]
                            .sort(
                                (a, b) =>
                                    Number(b.socketId === selfSocketId) -
                                    Number(a.socketId === selfSocketId),
                            )
                            .map((peer) => {
                                const self = peer.socketId === selfSocketId;
                                const cursor = cursors[peer.socketId]?.cursor;
                                return (
                                    <li key={peer.socketId}>
                                        <span
                                            className="peer-avatar"
                                            style={{
                                                color: participantColor(peer.id),
                                                borderColor: participantColor(peer.id),
                                            }}
                                        >
                                            {peer.displayName
                                                .split(" ")
                                                .map((part) => part[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </span>
                                        <div>
                                            <strong>
                                                {peer.displayName} {self && <small>(you)</small>}
                                            </strong>
                                            <span>
                                                {readable(peer.role)}
                                                {peer.isGuest && " · Guest"}
                                            </span>
                                        </div>
                                        <span className="peer-online" aria-label="Connected" />
                                        {!self && (
                                            <p>
                                                <MousePointer2 size={12} />
                                                {cursor
                                                    ? `Line ${cursor.lineNumber}, col ${cursor.column}`
                                                    : "Away from editor"}
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                    </ul>
                ) : (
                    <div className="people-empty">
                        <Users size={25} />
                        <p>
                            {status === "connected"
                                ? "Waiting for your teammate."
                                : "Participants appear when you connect."}
                        </p>
                    </div>
                )}
                <div className="presence-explainer">
                    <span>
                        <MousePointer2 size={15} />
                        Together in the details.
                    </span>
                    <p>Write together, see who’s here, and follow their cursor.</p>
                </div>
            </div>
            <div className="people-call-placeholder">
                <div className="call-placeholder-art">
                    <Video size={24} />
                    <Eye size={16} />
                </div>
                <strong>A little face time, soon.</strong>
                <p>Video and session chat will live here. For now, keep your usual call open.</p>
                <span>COMING LATER</span>
            </div>
        </aside>
    );
}
