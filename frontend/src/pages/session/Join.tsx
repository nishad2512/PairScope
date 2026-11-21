import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { Check, Users } from "lucide-react";
import Brand from "../../components/Brand";
import { Button, Field, Notice } from "../../components/ui/primitives";
import { joinSession } from "../../api/session.api";
import { useSessionStore } from "../../store/session.store";
import { useAuthStore } from "../../store/auth.store";
import type { Participant } from "../../types/api.types";
import { errorMessage, readable } from "../../lib/format";

export default function Join() {
    const { token = "" } = useParams();
    const setGuestAccess = useSessionStore((state) => state.setGuestAccess);
    const user = useAuthStore((s) => s.user);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [participant, setParticipant] = useState<Participant | null>(null);
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
            const response = await joinSession(
                token,
                String(form.get("name")).trim(),
            );
            const joined =
                "result" in response.data
                    ? response.data.result
                    : response.data;
            if ("result" in response.data) {
                if (!response.data.data.token)
                    throw new Error(
                        "Your guest credential is missing. Please try joining again.",
                    );
                setGuestAccess({
                    sessionId: joined.sessionId,
                    token: response.data.data.token,
                    participant: joined,
                    invitationToken: token,
                });
            }
            setParticipant(joined);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setBusy(false);
        }
    }
    return (
        <main className="join-page">
            <Brand />
            <section className="join-card">
                <span className="empty-icon">
                    {participant ? <Check size={28} /> : <Users size={28} />}
                </span>
                <span className="eyebrow">THERE’S ROOM FOR YOU HERE</span>
                <h1>
                    {participant
                        ? "You’re on the list."
                        : "Meet in the middle."}
                </h1>
                <p>
                    {participant
                        ? `Welcome, ${participant.displayName}. You’ve joined as ${readable(participant.role).toLowerCase()}. You’re ready to enter the workspace.`
                        : "You’ve been invited to a PairScope session. Let everyone know what to call you."}
                </p>
                {participant ? (
                    <div className="notice notice-success" role="status">
                        Your place in the session is confirmed.
                    </div>
                ) : (
                    <form className="form-stack" onSubmit={submit}>
                        {error && <Notice>{error}</Notice>}
                        <Field
                            label="Your name"
                            name="name"
                            defaultValue={user?.displayName || ""}
                            autoComplete="name"
                            placeholder="Alex Morgan"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                        <Button busy={busy}>Join session</Button>
                    </form>
                )}
                {participant && (
                    <Link
                        className="button button-primary"
                        to={`/sessions/${participant.sessionId}/editor`}
                    >
                        Enter workspace
                    </Link>
                )}
                <Link className="text-link" to={user ? "/dashboard" : "/login"}>
                    {user ? "Go to your workspace" : "Sign in to your account"}
                </Link>
            </section>
            <span className="muted">Good work happens together.</span>
        </main>
    );
}
