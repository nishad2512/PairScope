import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import { Building2, Plus, Users, Trash2 } from "lucide-react";
import {
    getMembers,
    getMyOrgs,
    getOrgById,
    getOrgBySlug,
    removeMember,
} from "../../api/org.api";
import { useResource } from "../../hooks/use-resource";
import {
    Avatar,
    Badge,
    Button,
    EmptyState,
    Loading,
    Modal,
    Notice,
} from "../../components/ui/primitives";
import Creation from "./Creation";
import InviteMemberDialog from "../../components/InviteMemberDialog";
import { errorMessage, readable } from "../../lib/format";
import type { OrgMember } from "../../types/api.types";

export default function Organizations() {
    const [creating, setCreating] = useState(false);
    const { data, error, loading, reload } = useResource(getMyOrgs);
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        GREAT PEOPLE. SHARED PURPOSE.
                    </span>
                    <h1>
                        Your organizations<span className="orange">.</span>
                    </h1>
                    <p>A home for every team you build with.</p>
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus size={18} />
                    New organization
                </Button>
            </div>
            {loading ? (
                <Loading />
            ) : error ? (
                <>
                    <Notice>{error}</Notice>
                    <Button onClick={reload}>Try again</Button>
                </>
            ) : data?.length ? (
                <div className="org-grid">
                    {data.map((org) => (
                        <Link
                            key={org.id || org.slug}
                            className="org-card"
                            to={`/organizations/${encodeURIComponent(org.id || org.slug)}`}
                        >
                            <div className="org-card-top">
                                <span className="org-icon">
                                    <Building2 size={24} />
                                </span>
                                <Badge>Workspace</Badge>
                            </div>
                            <h2>{org.name}</h2>
                            <p>{org.slug}</p>
                            <div className="org-card-footer">
                                <Users size={16} />
                                <span>Open organization</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <section className="panel">
                    <EmptyState
                        icon={<Building2 size={28} />}
                        title="Give your team a place to belong."
                        action={
                            <Button onClick={() => setCreating(true)}>
                                <Plus size={16} />
                                Create an organization
                            </Button>
                        }
                    >
                        Keep your interviews, collaborations, and teammates
                        connected.
                    </EmptyState>
                </section>
            )}
            {creating && <Creation onClose={() => setCreating(false)} />}
        </>
    );
}

export function OrganizationDetails() {
    const { orgId = "" } = useParams();
    const load = useCallback(async () => {
        const org = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(orgId)
            ? await getOrgById(orgId)
            : await getOrgBySlug(orgId);
        const result = org.id
            ? await getMembers(org.id)
            : { members: [], currentUserId: "" };
        return {
            org,
            currentUserId: result.currentUserId,
            members: result.members,
            role: result.members.find(
                (member) => member.userId === result.currentUserId,
            )?.role,
        };
    }, [orgId]);
    const { data, loading, error, reload } = useResource(load);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<OrgMember | null>(null);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    async function remove() {
        if (!data?.org.id || !removing?.id) return;
        setBusy(true);
        setActionError("");
        try {
            await removeMember(data.org.id, removing.id);
            setRemoving(null);
            reload();
        } catch (error) {
            setActionError(errorMessage(error));
        } finally {
            setBusy(false);
        }
    }
    if (loading) return <Loading />;
    if (error || !data)
        return (
            <>
                <Notice>{error || "Organization not found."}</Notice>
                <Button onClick={reload}>Try again</Button>
            </>
        );
    const canManage = data.role === "OWNER" || data.role === "ADMIN";
    return (
        <>
            <Link className="text-link back-link" to="/organizations">
                Back to organizations
            </Link>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">{data.org.slug}</span>
                    <h1>
                        {data.org.name}
                        <span className="orange">.</span>
                    </h1>
                    <p>Different strengths. One shared workspace.</p>
                </div>
                {canManage && (
                    <Button
                        onClick={() => {
                            setActionError("");
                            setAdding(true);
                        }}
                        disabled={!data.org.id}
                        title={
                            !canManage
                                ? "Only owners and admins can invite members"
                                : undefined
                        }
                    >
                        <Plus size={18} />
                        Invite member
                    </Button>
                )}
            </div>
            {!canManage && (
                <p className="organization-access-note">
                    You’re viewing your team as an interviewer. An owner or
                    admin can invite teammates.
                </p>
            )}
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>People in your workspace</h2>
                        <p>
                            {data.members.length}{" "}
                            {data.members.length === 1 ? "member" : "members"} ·
                            The minds behind the work.
                        </p>
                    </div>
                    <Users size={20} />
                </div>
                {data.members.length ? (
                    <div className="member-list">
                        {data.members.map((member) => (
                            <div
                                className="member-row"
                                key={member.id || member.userId}
                            >
                                <Avatar
                                    name={member.displayName || "Member"}
                                    src={member.avatarUrl}
                                    small
                                />
                                <div>
                                    <strong>
                                        {member.displayName ||
                                            "Name unavailable"}
                                        {member.userId ===
                                            data.currentUserId && (
                                            <span className="member-you">
                                                {" "}
                                                (you)
                                            </span>
                                        )}
                                    </strong>
                                    <small>
                                        {member.userId === data.currentUserId
                                            ? "Your account"
                                            : "Team member"}
                                    </small>
                                </div>
                                <Badge>{readable(member.role)}</Badge>
                                {canManage &&
                                    member.role !== "OWNER" &&
                                    (member.role !== "ADMIN" ||
                                        data.role === "OWNER") &&
                                    member.id && (
                                        <button
                                            className="icon-button"
                                            aria-label={`Remove ${member.displayName || "member"}`}
                                            onClick={() => {
                                                setActionError("");
                                                setRemoving(member);
                                            }}
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={<Users />} title="Room for your people.">
                        Invite a registered user to start building your team.
                    </EmptyState>
                )}
            </section>
            {adding && data.org.id && (
                <InviteMemberDialog
                    orgId={data.org.id}
                    name={data.org.name}
                    canInviteAdmin={data.role === "OWNER"}
                    onClose={() => setAdding(false)}
                />
            )}
            {removing && (
                <Modal
                    title={`Remove ${removing.displayName || "this member"}?`}
                    description="They will lose access to this organization. They will need a new invitation to rejoin."
                    busy={busy}
                    onClose={() => setRemoving(null)}
                >
                    {actionError && <Notice>{actionError}</Notice>}
                    <div className="modal-actions">
                        <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() => setRemoving(null)}
                        >
                            Keep member
                        </Button>
                        <Button variant="danger" busy={busy} onClick={remove}>
                            Remove member
                        </Button>
                    </div>
                </Modal>
            )}
        </>
    );
}
