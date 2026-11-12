import { Search } from "lucide-react";
import { useState } from "react";
import { EmptySessions, SessionList } from "@/components/sessions/session-display";
import { LoadError, Loading } from "@/components/ui/feedback";
import { useSessions } from "@/hooks/use-sessions";

export function SessionsPage() {
  const { sessions, loading, error, retry } = useSessions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = search.trim().toLowerCase();
  const matching = sessions.filter((session) =>
    (!status || session.status === status) &&
    [session.title, session.language, session.description ?? ""].some((value) => value.toLowerCase().includes(query)),
  );

  return (
    <>
      <div className="page-heading"><h1>Sessions</h1><p className="muted">Find and manage your pairing sessions and interviews.</p></div>
      <section className="panel">
        <div className="filters">
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Search sessions…" aria-label="Search sessions" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        {loading ? <Loading label="Loading sessions…" />
          : error ? <LoadError message={error} retry={retry} />
          : matching.length ? <SessionList sessions={matching} /> : <EmptySessions filtered={Boolean(query || status)} />}
      </section>
    </>
  );
}
