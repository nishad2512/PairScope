import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CircleCheck, Mail, ShieldCheck, Users } from "lucide-react";
import { inviteMember } from "../api/org.api";
import type { OrganizationInvitation } from "../api/org.api";
import type { MemberRole } from "../types/api.types";
import { errorMessage, dateTime } from "../lib/format";
import { Button, Field, Modal, Notice } from "./ui/primitives";
import CopyLink from "./CopyLink";

export default function InviteMemberDialog({
    orgId,
    name,
    canInviteAdmin,
    onClose,
}: {
    orgId: string;
    name: string;
    canInviteAdmin: boolean;
    onClose: () => void;
}) {
    const resultHeading = useRef<HTMLHeadingElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [invitation, setInvitation] = useState<
        (OrganizationInvitation & { email: string }) | null
    >(null);

    useEffect(() => {
        if (invitation) resultHeading.current?.focus();
    }, [invitation]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email")).trim().toLowerCase();
        setBusy(true);
        setError("");
        try {
            const result = await inviteMember(orgId, {
                email,
                role: String(form.get("role")) as MemberRole,
            });
            setInvitation({ ...result, email });
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            title={
                invitation
                    ? "An invitation to belong."
                    : "Bring your people together."
            }
            description={
                invitation
                    ? `Invitation created for ${invitation.email}.`
                    : `Invite a teammate to ${name}. They choose when to join.`
            }
            eyebrow="GROW YOUR TEAM"
            busy={busy}
            onClose={onClose}
        >
            {invitation ? (
                <div className="form-stack">
                    <div
                        className={`invitation-result ${invitation.emailStatus === "failed" ? "delivery-warning" : ""}`}
                    >
                        <span className="invitation-result-icon">
                            {invitation.emailStatus === "queued" ? (
                                <CircleCheck size={24} />
                            ) : (
                                <Mail size={24} />
                            )}
                        </span>
                        <div role="status">
                            <h3 ref={resultHeading} tabIndex={-1}>
                                {invitation.emailStatus === "queued"
                                    ? "Invitation email queued"
                                    : "Share the invitation directly"}
                            </h3>
                            <p>
                                {invitation.emailStatus === "queued"
                                    ? "Your teammate will receive a link to accept. They’ll appear in your team after joining."
                                    : "The invitation is ready, but the email could not be queued. Copy the link below and send it to your teammate."}
                            </p>
                        </div>
                    </div>
                    <CopyLink
                        value={`${window.location.origin}/organizations/join/${invitation.token}`}
                    />
                    {invitation.invitation?.expiresAt && (
                        <p className="invitation-expiry">
                            Valid until{" "}
                            {dateTime(invitation.invitation.expiresAt)} · your
                            local time
                        </p>
                    )}
                    <div className="modal-actions">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setInvitation(null);
                                setError("");
                            }}
                        >
                            Invite another
                        </Button>
                        <Button onClick={onClose}>Done</Button>
                    </div>
                </div>
            ) : (
                <form className="form-stack" onSubmit={submit}>
                    {error && <Notice>{error}</Notice>}
                    <Field
                        label="Email address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="teammate@example.com"
                        autoFocus
                        required
                        maxLength={254}
                        disabled={busy}
                        hint="Use the email linked to their existing PairScope account."
                    />
                    <fieldset className="invitation-roles" disabled={busy}>
                        <legend>Choose their role</legend>
                        <label className="invitation-role">
                            <input
                                type="radio"
                                name="role"
                                value="INTERVIEWER"
                                defaultChecked
                            />
                            <Users size={18} />
                            <span>
                                <strong>Interviewer</strong>
                                <small>
                                    Join the team without managing memberships.
                                </small>
                            </span>
                        </label>
                        {canInviteAdmin && (
                            <label className="invitation-role">
                                <input type="radio" name="role" value="ADMIN" />
                                <ShieldCheck size={18} />
                                <span>
                                    <strong>Admin</strong>
                                    <small>
                                        Invite interviewers and manage team
                                        members.
                                    </small>
                                </span>
                            </label>
                        )}
                    </fieldset>
                    <div className="invitation-note">
                        <Mail size={16} />
                        <p>
                            We’ll email an account-specific link. Your teammate
                            must accept before becoming a member.
                        </p>
                    </div>
                    <div className="modal-actions">
                        <Button
                            variant="secondary"
                            type="button"
                            disabled={busy}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button busy={busy}>
                            <Mail size={16} />
                            {busy ? "Creating invitation…" : "Send invitation"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
