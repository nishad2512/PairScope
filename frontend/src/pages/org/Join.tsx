import { useState } from "react";
import { Link, useParams } from "react-router";
import Brand from "../../components/Brand";
import { Button, Notice } from "../../components/ui/primitives";
import { joinOrganization } from "../../api/org.api";
import { errorMessage } from "../../lib/format";

export default function JoinOrganization() {
    const { token = "" } = useParams();
    const [orgId, setOrgId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function join() {
        setBusy(true);
        setError("");
        try {
            const member = await joinOrganization(token);
            setOrgId(member.orgId || "");
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
                <span className="eyebrow">YOUR TEAM IS WAITING</span>
                <h1>
                    {orgId
                        ? "You’re part of the team."
                        : "Join your organization."}
                </h1>
                <p>
                    {orgId
                        ? "Your membership is ready."
                        : "Accept this invitation using the account it was sent to."}
                </p>
                {error && <Notice>{error}</Notice>}
                {orgId ? (
                    <Link
                        className="button button-primary"
                        to={`/organizations/${orgId}`}
                    >
                        Open organization
                    </Link>
                ) : (
                    <Button busy={busy} onClick={join}>
                        Accept invitation
                    </Button>
                )}
                <Link className="text-link" to="/organizations">
                    Back to organizations
                </Link>
            </section>
        </main>
    );
}
