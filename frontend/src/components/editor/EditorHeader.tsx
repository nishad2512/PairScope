import { Bug, ChevronLeft, Play, Users } from "lucide-react";
import { Link } from "react-router";
import Brand from "../Brand";
import { Button } from "../ui/primitives";
import type { ConnectionStatus } from "../../types/realtime.types";

export default function EditorHeader({
    title,
    count,
    status,
    showPeople,
    onTogglePeople,
    leaveTo,
}: {
    title: string;
    count: number;
    status: ConnectionStatus;
    showPeople: boolean;
    onTogglePeople: () => void;
    leaveTo: string;
}) {
    return (
        <header className="editor-header">
            <div className="editor-heading">
                <Brand />
                <span className="editor-heading-divider" />
                <div>
                    <h1>{title}</h1>
                    <span className={`editor-connection ${status}`} role="status">
                        <i />
                        {status === "connected"
                            ? "Presence connected"
                            : status === "error"
                              ? "Connection unavailable"
                              : status === "joining"
                                ? "Joining session…"
                                : status === "disconnected"
                                  ? "Disconnected"
                                  : status === "reconnecting"
                                    ? "Reconnecting…"
                                    : "Connecting…"}
                    </span>
                </div>
            </div>
            <div className="editor-header-actions">
                <Button
                    variant="secondary"
                    aria-label="Debug code, coming later"
                    disabled
                    title="Debugging will be available when the execution service is ready."
                >
                    <Bug size={15} />
                    <span>Debug</span>
                </Button>
                <Button
                    disabled
                    aria-label="Run code, coming later"
                    title="Code execution is not available yet."
                >
                    <Play size={14} fill="currentColor" />
                    <span>Run code</span>
                </Button>
                <button
                    className={`editor-people-toggle ${showPeople ? "active" : ""}`}
                    onClick={onTogglePeople}
                    aria-expanded={showPeople}
                    aria-controls="session-people"
                    aria-label="Toggle participants"
                >
                    <Users size={17} />
                    <span>{count}</span>
                </button>
                <Link className="editor-leave" aria-label="Leave session" to={leaveTo}>
                    <ChevronLeft size={15} />
                    <span>Leave</span>
                </Link>
            </div>
        </header>
    );
}
