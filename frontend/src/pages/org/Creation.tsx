import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { createOrg } from "../../api/org.api";
import { Button, Field, Modal, Notice } from "../../components/ui/primitives";
import { errorMessage } from "../../lib/format";

export default function Creation({ onClose }: { onClose: () => void }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
            const created = await createOrg({
                name: String(form.get("name")).trim(),
                slug: String(form.get("slug")).trim(),
                password: String(form.get("password")),
            });
            onClose();
            navigate(
                `/organizations/${encodeURIComponent(created.org.id || created.org.slug)}`,
            );
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setBusy(false);
        }
    }
    return (
        <Modal
            title="A home for your team."
            description="Keep your people and shared work in one place."
            onClose={onClose}
        >
            <form className="form-stack" onSubmit={submit}>
                {error && <Notice>{error}</Notice>}
                <Field
                    label="Organization name"
                    name="name"
                    placeholder="e.g. Acme Engineering"
                    required
                    minLength={3}
                    maxLength={20}
                />
                <Field
                    label="Workspace slug"
                    name="slug"
                    placeholder="acme-engineering"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    title="Use lowercase letters, numbers, and single hyphens between words"
                    hint="A unique name using lowercase letters, numbers, and hyphens."
                    required
                    minLength={3}
                    maxLength={20}
                />
                <Field
                    label="Organization password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={64}
                    required
                />
                <div className="modal-actions">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button busy={busy}>Create organization</Button>
                </div>
            </form>
        </Modal>
    );
}
