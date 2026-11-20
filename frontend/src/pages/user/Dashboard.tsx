import { useState } from "react";
import { Link } from "react-router";
import {
    Plus,
    Layers2,
    MessagesSquare,
    Code2,
    CalendarDays,
    Sparkles,
} from "lucide-react";
import { getSessions } from "../../api/session.api";
import { useResource } from "../../hooks/use-resource";
import { useAuthStore } from "../../store/auth.store";
import {
    Button,
    EmptyState,
    Loading,
    Notice,
} from "../../components/ui/primitives";
import CreateSessionDialog from "../../components/CreateSessionDialog";
import SessionList from "../../components/SessionList";

export default function Dashboard() {
    const { data, error, loading, reload } = useResource(getSessions);
    const [creating, setCreating] = useState(false);
    const name = useAuthStore(
        (s) => s.user?.displayName.split(" ")[0] || "there",
    );
    const sessions = data || [];
    const upcoming = sessions.filter(
        (s) => s.scheduledAt && new Date(s.scheduledAt) > new Date(),
    );
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">YOUR WORKSPACE, AT A GLANCE</span>
                    <h1>
                        Good to see you, {name}
                        <span className="orange">.</span>
                    </h1>
                    <p>A fresh perspective is just a session away.</p>
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus size={18} />
                    New session
                </Button>
            </div>
            <section className="dashboard-hero">
                <div>
                    <span className="hero-label">
                        <Sparkles size={15} /> A LITTLE COLLABORATION. A LOT OF
                        POSSIBILITY.
                    </span>
                    <h2>
                        Big ideas start
                        <br />
                        with a shared space.
                    </h2>
                    <p>
                        Meet your next teammate. Untangle a tricky problem.
                        <br />
                        Find your flow, together.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => setCreating(true)}
                    >
                        Create a session <Plus size={17} />
                    </Button>
                </div>
                <div className="hero-art" aria-hidden="true">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="orbit-center">
                        <Code2 size={48} strokeWidth={1.5} />
                    </div>
                    <span className="orbit-card card-one">
                        <MessagesSquare size={18} />
                        Think together.
                    </span>
                    <span className="orbit-card card-two">
                        <span className="mini-avatar">A</span>
                        <span className="mini-avatar dark">J</span>Build better.
                    </span>
                    <span className="orbit-spark">✳</span>
                </div>
            </section>
            <div className="stats-grid">
                {[
                    {
                        label: "Total sessions",
                        value: sessions.length,
                        icon: Layers2,
                        caption: "Ideas brought together",
                    },
                    {
                        label: "Interviews",
                        value: sessions.filter(
                            (s) => s.sessionType.toUpperCase() === "INTERVIEW",
                        ).length,
                        icon: MessagesSquare,
                        caption: "Potential, in perspective",
                    },
                    {
                        label: "Collaborations",
                        value: sessions.filter(
                            (s) =>
                                s.sessionType.toUpperCase() === "COLLABORATION",
                        ).length,
                        icon: Code2,
                        caption: "Better with a teammate",
                    },
                    {
                        label: "Upcoming",
                        value: upcoming.length,
                        icon: CalendarDays,
                        caption: "Your next shared moments",
                    },
                ].map((item) => (
                    <div className="stat-card" key={item.label}>
                        <div>
                            <span>{item.label}</span>
                            <item.icon size={18} />
                        </div>
                        <strong>{loading || error ? "—" : item.value}</strong>
                        <small>{item.caption}</small>
                    </div>
                ))}
            </div>
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>Recent sessions</h2>
                        <p>Pick up where the conversation left off.</p>
                    </div>
                    <Link className="text-link" to="/sessions">
                        View all sessions
                    </Link>
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
                ) : sessions.length ? (
                    <SessionList
                        sessions={[...sessions]
                            .sort(
                                (a, b) =>
                                    Date.parse(b.createdAt) -
                                    Date.parse(a.createdAt),
                            )
                            .slice(0, 5)}
                    />
                ) : (
                    <EmptyState
                        icon={<Layers2 size={28} />}
                        title="Your first session starts here."
                        action={
                            <Button
                                variant="secondary"
                                onClick={() => setCreating(true)}
                            >
                                <Plus size={16} />
                                Create a session
                            </Button>
                        }
                    >
                        A good conversation can change everything. Make room for
                        one.
                    </EmptyState>
                )}
            </section>
            {creating && (
                <CreateSessionDialog onClose={() => setCreating(false)} />
            )}
        </>
    );
}
