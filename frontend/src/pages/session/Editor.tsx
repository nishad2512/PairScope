import { useCallback, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { AlertCircle, Code2, FileCode2, LockKeyhole, MousePointer2 } from "lucide-react";
import EditorHeader from "../../components/editor/EditorHeader";
import CodeEditor from "../../components/editor/CodeEditor";
import ParticipantsPanel from "../../components/editor/ParticipantsPanel";
import SessionConsole from "../../components/editor/SessionConsole";
import { useAuthStore } from "../../store/auth.store";
import { useSessionStore } from "../../store/session.store";
import { useSessionPresence } from "../../hooks/useSessionPresence";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import type { CursorPosition } from "../../types/realtime.types";
import "./editor.css";

export default function Editor() {
    const { sessionId = "" } = useParams();
    const accessToken = useAuthStore((state) => state.accessToken);
    const guest = useSessionStore((state) => state.guestAccess);
    const guestAccess = guest?.sessionId === sessionId ? guest : null;
    const token = guestAccess?.token || accessToken;
    if (!token)
        return (
            <Navigate
                to={`/login?next=${encodeURIComponent(`/sessions/${sessionId}/editor`)}`}
                replace
            />
        );
    return (
        <EditorWorkspace
            key={`${sessionId}:${guestAccess?.participant.id || "account"}`}
            sessionId={sessionId}
            token={token}
            isGuest={!!guestAccess}
        />
    );
}

function EditorWorkspace({
    sessionId,
    token,
    isGuest,
}: {
    sessionId: string;
    token: string;
    isGuest: boolean;
}) {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const guest = useSessionStore((state) => state.guestAccess);
    const presence = useSessionPresence(sessionId, token, isGuest);
    const draft = useLocalDraft(
        `pairscope:draft:${sessionId}:${isGuest ? guest?.participant.id : user?.email || "account"}`,
    );
    const [position, setPosition] = useState<CursorPosition>({
        lineNumber: 1,
        column: 1,
    });
    const [showPeople, setShowPeople] = useState(
        () => window.matchMedia("(min-width: 900px)").matches,
    );
    const onPosition = useCallback(
        (value: CursorPosition) =>
            setPosition({ lineNumber: value.lineNumber, column: value.column }),
        [],
    );
    const metadata = location.state as {
        title?: string;
        language?: string;
    } | null;
    const title = typeof metadata?.title === "string" ? metadata.title : "Session workspace";
    const language = (
        presence.session?.language ||
        metadata?.language ||
        "javascript"
    ).toLowerCase();
    const extension =
        (
            {
                javascript: "js",
                typescript: "ts",
                python: "py",
                java: "java",
                cpp: "cpp",
                go: "go",
            } as Record<string, string>
        )[language] || "txt";
    const readOnly = presence.session?.participant.role === "OBSERVER";
    const peers = presence.participants.filter((peer) => peer.socketId !== presence.selfSocketId);
    return (
        <main className="pair-editor">
            <EditorHeader
                title={title}
                count={presence.participants.length}
                status={presence.status}
                showPeople={showPeople}
                onTogglePeople={() => setShowPeople(!showPeople)}
                leaveTo={isGuest ? "/login" : `/sessions/${sessionId}`}
            />
            <div className="editor-session-strip">
                <span>
                    <Code2 size={14} />
                    {presence.session?.status === "scheduled"
                        ? "Scheduled workspace"
                        : "Session workspace"}
                </span>
                <span>
                    <MousePointer2 size={13} />
                    Live presence & cursors
                </span>
                <span className="editor-local-label">
                    <LockKeyhole size={12} />
                    Local draft
                </span>
            </div>
            {(presence.error || draft.error) && (
                <div className="editor-alert" role="alert">
                    <AlertCircle size={17} />
                    <span>{draft.error || presence.error}</span>
                    {presence.error && <button onClick={presence.reconnect}>Reconnect</button>}
                    {isGuest && guest && (
                        <Link to={`/join/${encodeURIComponent(guest.invitationToken)}`}>
                            Reopen invitation
                        </Link>
                    )}
                </div>
            )}
            <div className={`editor-body ${showPeople ? "with-people" : ""}`}>
                <section className="editor-workbench" aria-label="Editor and output">
                    <div className="editor-filebar">
                        <span className="editor-file-tab">
                            <FileCode2 size={15} />
                            main.{extension}
                            <span className="file-tab-dot" title="Local draft" />
                        </span>
                        <span>{readOnly ? "Read only" : language}</span>
                    </div>
                    <div className="editor-code-area">
                        <CodeEditor
                            sessionId={sessionId}
                            language={language === "c++" ? "cpp" : language}
                            value={draft.value}
                            readOnly={readOnly}
                            onChange={draft.change}
                            onCursor={presence.sendCursor}
                            onPosition={onPosition}
                            participants={peers}
                            cursors={presence.cursors}
                        />
                        {!draft.value && (
                            <div className="editor-start-hint" aria-hidden="true">
                                <p>A little space to think.</p>
                                <span>
                                    Start typing. Your cursor is shared; your code stays local.
                                </span>
                            </div>
                        )}
                    </div>
                    <SessionConsole />
                </section>
                {showPeople && (
                    <ParticipantsPanel
                        participants={presence.participants}
                        cursors={presence.cursors}
                        selfSocketId={presence.selfSocketId}
                        status={presence.status}
                    />
                )}
            </div>
            <footer className="editor-statusbar">
                <span>
                    <i className={presence.status === "connected" ? "connected" : ""} />
                    {presence.status === "connected" ? "Presence is live" : "Presence offline"}
                </span>
                <span>
                    {readOnly ? "Observer" : "Local draft"}
                    <span className="statusbar-separator" />
                    Ln {position.lineNumber}, Col {position.column}
                    <span className="statusbar-separator" />
                    UTF-8
                </span>
            </footer>
        </main>
    );
}
