import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Code2, MessagesSquare } from "lucide-react";
import { createSession } from "../api/session.api";
import { getMyOrgs } from "../api/org.api";
import { useResource } from "../hooks/use-resource";
import { Button, Field, Modal, Notice, Select } from "./ui/primitives";
import type { SessionType } from "../types/api.types";
import { errorMessage } from "../lib/format";
export default function CreateSessionDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const [minDate] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
  );
  const [type, setType] = useState<SessionType>("INTERVIEW");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const orgs = useResource(getMyOrgs);
  const navigate = useNavigate();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const session = await createSession({
        title: String(form.get("title")).trim(),
        description: String(form.get("description")).trim() || null,
        language: String(form.get("language")),
        sessionType: type,
        orgId: String(form.get("orgId") || "") || null,
        scheduledAt: form.get("scheduledAt")
          ? new Date(String(form.get("scheduledAt"))).toISOString()
          : null,
      });
      onClose();
      navigate(`/sessions/${session.id}`);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Start something great."
      description="Bring the right people and a fresh perspective."
      busy={busy}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        {error && <Notice>{error}</Notice>}
        <div className="type-picker" role="group" aria-label="Session type">
          {(
            [
              {
                value: "INTERVIEW",
                label: "Interview",
                text: "Find your next great teammate",
                icon: MessagesSquare,
              },
              {
                value: "COLLABORATION",
                label: "Collaboration",
                text: "Solve something together",
                icon: Code2,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={type === item.value}
              className={type === item.value ? "selected" : ""}
              onClick={() => setType(item.value)}
            >
              <item.icon size={21} />
              <strong>{item.label}</strong>
              <small>{item.text}</small>
            </button>
          ))}
        </div>
        <Field
          label="Session name"
          name="title"
          placeholder="e.g. Frontend engineering interview"
          required
          minLength={3}
          maxLength={100}
        />
        <label className="field">
          <span>
            Description <small>(optional)</small>
          </span>
          <textarea
            name="description"
            placeholder="A little context goes a long way…"
            rows={3}
            maxLength={1000}
          />
        </label>
        <div className="form-grid">
          <Select label="Language" name="language">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
          </Select>
          <Select label="Workspace" name="orgId" disabled={orgs.loading}>
            <option value="">Personal workspace</option>
            {orgs.data
              ?.filter((org) => org.id)
              .map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
          </Select>
        </div>
        {orgs.error && (
          <Notice>
            Organizations couldn’t be loaded. You can still create a personal
            session.{" "}
            <button type="button" className="text-button" onClick={orgs.reload}>
              Retry
            </button>
          </Notice>
        )}
        <Field
          label="Schedule for later (optional)"
          name="scheduledAt"
          type="datetime-local"
          min={minDate}
          hint="Leave blank to create an unscheduled session. Times use your device’s timezone."
        />
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button busy={busy}>Create session</Button>
        </div>
      </form>
    </Modal>
  );
}
