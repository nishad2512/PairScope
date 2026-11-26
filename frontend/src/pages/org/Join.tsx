import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
    ArrowRight,
    Building2,
    Check,
    CircleCheck,
    Mail,
    ShieldCheck,
} from "lucide-react";
import Brand from "../../components/Brand";
import { Button, Notice } from "../../components/ui/primitives";
import { joinOrganization } from "../../api/org.api";
import { logout } from "../../api/auth.api";
import { ApiError } from "../../api/client";
import { useAuthStore } from "../../store/auth.store";
import { errorMessage, readable } from "../../lib/format";
import type { OrgMember } from "../../types/api.types";

export default function JoinOrganization() {
    const { token = "" } = useParams();
    return <OrganizationInvitation key={token} token={token} />;
}

function OrganizationInvitation({ token }: { token: string }) {
    const user = useAuthStore((state) => state.user);
    const accessToken = useAuthStore((state) => state.accessToken);
    const navigate = useNavigate();
    const heading = useRef<HTMLHeadingElement>(null);
    const [member, setMember] = useState<OrgMember | null>(null);
    const [action, setAction] = useState<"join" | "switch" | null>(null);
    const [error, setError] = useState<{
        message: string;
        status?: number;
    } | null>(null);
    const validToken = /^[a-f0-9]{64}$/i.test(token);
    const wrongAccount =
        error?.status === 403 &&
        error.message.toLowerCase().includes("account");
    const unavailable =
        !validToken ||
        error?.status === 400 ||
        error?.status === 409 ||
        (error?.status === 403 && !wrongAccount);
    const next = `/organizations/join/${token}`;
    const loginUrl = `/login?next=${encodeURIComponent(next)}`;

    useEffect(() => {
        if (member || error) heading.current?.focus();
    }, [member, error]);

    async function join() {
        if (action || unavailable) return;
        setAction("join");
        setError(null);
        try {
            const result = await joinOrganization(token);
            if (!result.orgId)
                throw new Error(
                    "Your membership could not be confirmed. Please try again.",
                );
            setMember(result);
        } catch (error) {
            setError({
                message: errorMessage(error),
                status: error instanceof ApiError ? error.status : undefined,
            });
        } finally {
            setAction(null);
        }
    }

    async function switchAccount() {
        setAction("switch");
        try {
            await logout();
        } catch {
            // Logout clears local credentials even when the server is unavailable.
        } finally {
            navigate(loginUrl, { replace: true });
        }
    }

    return (
        <main className="join-page org-join-page">
            <Brand />
            <div className="org-join-main">
                <section
                    className={`join-card org-join-card ${member ? "joined" : ""}`}
                    aria-labelledby="organization-invitation-title"
                >
                    <ol
                        className="invitation-steps"
                        aria-label="Membership invitation steps"
                    >
                        <li
                            className={
                                accessToken || member ? "done" : "current"
                            }
                        >
                            {accessToken || member ? <Check size={12} /> : "1"}
                            <span>Sign in</span>
                        </li>
                        <li
                            className={
                                member ? "done" : accessToken ? "current" : ""
                            }
                        >
                            {member ? <Check size={12} /> : "2"}
                            <span>Accept</span>
                        </li>
                        <li className={member ? "current" : ""}>
                            3<span>Join the team</span>
                        </li>
                    </ol>
                    <div className="org-invitation-icon">
                        {member ? (
                            <CircleCheck size={28} />
                        ) : (
                            <Building2 size={28} />
                        )}
                    </div>
                    <div className="org-invitation-heading">
                        <span className="eyebrow">
                            {member
                                ? "WELCOME TO THE TEAM"
                                : "A PLACE ON THE TEAM"}
                        </span>
                        <h1
                            ref={heading}
                            tabIndex={-1}
                            id="organization-invitation-title"
                        >
                            {member
                                ? "You’re part of the team."
                                : unavailable
                                  ? "This invitation is unavailable."
                                  : wrongAccount
                                    ? "Use your invited account."
                                    : "Good work starts with good people."}
                        </h1>
                        <p>
                            {member
                                ? `You’ve joined as ${readable(member.role).toLowerCase()}. Your workspace is ready.`
                                : unavailable
                                  ? "Ask an organization owner or admin for a fresh invitation."
                                  : wrongAccount
                                    ? "This invitation belongs to a different account. Switch to the email address it was sent to."
                                    : "You’ve been invited to a PairScope organization. Accept to join your teammates and their shared workspace."}
                        </p>
                    </div>
                    {error && <Notice>{error.message}</Notice>}
                    {!member && accessToken && user && (
                        <div className="invitation-account">
                            <span className="invitation-account-icon">
                                <Mail size={18} />
                            </span>
                            <div>
                                <small>Accepting with</small>
                                <strong>{user.email}</strong>
                            </div>
                        </div>
                    )}
                    {member ? (
                        <Link
                            className="button button-primary"
                            to={`/organizations/${member.orgId}`}
                        >
                            Open organization <ArrowRight size={17} />
                        </Link>
                    ) : unavailable ? (
                        <Link
                            className="button button-secondary"
                            to={accessToken ? "/organizations" : "/login"}
                        >
                            Back to {accessToken ? "organizations" : "sign in"}
                        </Link>
                    ) : wrongAccount ? (
                        <Button
                            busy={action === "switch"}
                            disabled={!!action}
                            onClick={switchAccount}
                        >
                            Switch to the invited account{" "}
                            <ArrowRight size={17} />
                        </Button>
                    ) : accessToken ? (
                        <>
                            <Button
                                busy={action === "join"}
                                disabled={!!action}
                                onClick={join}
                            >
                                {action === "join"
                                    ? "Joining your team…"
                                    : error
                                      ? "Try accepting again"
                                      : "Accept invitation"}
                                <ArrowRight size={17} />
                            </Button>
                            <Button
                                variant="ghost"
                                busy={action === "switch"}
                                disabled={!!action}
                                onClick={switchAccount}
                            >
                                Use a different account
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link
                                className="button button-primary"
                                to={loginUrl}
                            >
                                Sign in to accept <ArrowRight size={17} />
                            </Link>
                            <p className="invitation-signin-hint">
                                Sign in with the email address that received
                                this invitation. We’ll bring you right back
                                here.
                            </p>
                        </>
                    )}
                    <div className="invitation-note">
                        <ShieldCheck size={16} />
                        <p>
                            {member
                                ? "Your membership is active. You can now open your organization."
                                : "The link is tied to the invited account. Opening it won’t add you until you accept."}
                        </p>
                    </div>
                </section>
            </div>
            <p className="muted">Your people. Your workspace. PairScope.</p>
        </main>
    );
}
