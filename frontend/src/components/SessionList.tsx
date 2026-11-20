import { Link } from "react-router";
import {
    Code2,
    MessagesSquare,
    CalendarDays,
    MoreHorizontal,
} from "lucide-react";
import type { SessionSummary } from "../types/api.types";
import { Badge } from "./ui/primitives";
import { dateTime, readable } from "../lib/format";
export default function SessionList({
    sessions,
}: {
    sessions: SessionSummary[];
}) {
    return (
        <div className="session-list">
            <div className="session-table-header">
                <span>SESSION</span>
                <span>LANGUAGE</span>
                <span>DATE</span>
                <span>STATUS</span>
                <span />
            </div>
            {sessions.map((session) => (
                <Link
                    className="session-row"
                    key={session.id}
                    to={`/sessions/${session.id}`}
                >
                    <div className="session-title-cell">
                        <span
                            className={`session-icon ${session.sessionType.toUpperCase() === "COLLABORATION" ? "purple" : ""}`}
                        >
                            {session.sessionType.toUpperCase() ===
                            "COLLABORATION" ? (
                                <Code2 size={21} />
                            ) : (
                                <MessagesSquare size={21} />
                            )}
                        </span>
                        <span>
                            <strong>{session.title}</strong>
                            <small>{readable(session.sessionType)}</small>
                        </span>
                    </div>
                    <span className="language-tag">
                        <Code2 size={14} />
                        {session.language}
                    </span>
                    <span className="session-date">
                        <CalendarDays size={14} />
                        {dateTime(session.scheduledAt || session.createdAt)}
                    </span>
                    <Badge
                        tone={
                            ["ACTIVE", "LIVE", "IN_PROGRESS"].includes(
                                session.status.toUpperCase(),
                            )
                                ? "green"
                                : ""
                        }
                    >
                        {readable(session.status)}
                    </Badge>
                    <MoreHorizontal className="row-more" size={18} />
                </Link>
            ))}
        </div>
    );
}
