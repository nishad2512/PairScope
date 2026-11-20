import { useState } from "react";
import { Plus, Search, Layers2 } from "lucide-react";
import { getSessions } from "../../api/session.api";
import { useResource } from "../../hooks/use-resource";
import {
  Button,
  EmptyState,
  Loading,
  Notice,
} from "../../components/ui/primitives";
import CreateSessionDialog from "../../components/CreateSessionDialog";
import SessionList from "../../components/SessionList";
export default function Sessions() {
  const { data, error, loading, reload } = useResource(getSessions);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const sessions = data || [];
  const filtered = sessions
    .filter(
      (s) =>
        (filter === "ALL" || s.sessionType.toUpperCase() === filter) &&
        (status === "ALL" || s.status === status) &&
        `${s.title} ${s.language} ${s.description || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A PLACE TO THINK TOGETHER</span>
          <h1>
            Your sessions<span className="orange">.</span>
          </h1>
          <p>Every conversation is a new possibility.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={18} />
          New session
        </Button>
      </div>
      <section className="panel">
        <div className="session-toolbar">
          <div className="tabs" role="group" aria-label="Filter session type">
            {[
              { value: "ALL", label: "All sessions" },
              { value: "INTERVIEW", label: "Interviews" },
              { value: "COLLABORATION", label: "Collaborations" },
            ].map((tab) => (
              <button
                key={tab.value}
                aria-pressed={filter === tab.value}
                className={filter === tab.value ? "active" : ""}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
                {tab.value === "ALL" && <span>{sessions.length}</span>}
              </button>
            ))}
          </div>
          <div className="search-controls">
            <label className="search-input">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions…"
                aria-label="Search sessions"
              />
            </label>
            <select
              className="status-select"
              aria-label="Filter status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              {[...new Set(sessions.map((s) => s.status))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="panel-padding">
            <Notice>{error}</Notice>
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : filtered.length ? (
          <SessionList sessions={filtered} />
        ) : (
          <EmptyState
            icon={<Layers2 size={28} />}
            title={
              sessions.length
                ? "No sessions found."
                : "A blank slate. A world of possibilities."
            }
            action={
              sessions.length ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("ALL");
                    setStatus("ALL");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setCreating(true)}>
                  <Plus size={16} />
                  Create your first session
                </Button>
              )
            }
          >
            {sessions.length
              ? "Try another search or adjust your filters."
              : "Start an interview or invite someone to solve a problem together."}
          </EmptyState>
        )}
        <div className="list-footer">
          {loading
            ? "Loading sessions…"
            : `Showing ${filtered.length} of ${sessions.length} sessions`}
          <span>Good work happens together.</span>
        </div>
      </section>
      {creating && <CreateSessionDialog onClose={() => setCreating(false)} />}
    </>
  );
}
