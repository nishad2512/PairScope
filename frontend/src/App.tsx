import { lazy, Suspense, useEffect, useState } from "react";
import {
    BrowserRouter,
    Link,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router";
import { RequireAnon, RequireAuth } from "./components/guards";
import { tryRestoreSession } from "./api/auth.api";
import { useAuthStore } from "./store/auth.store";
import { EmptyState, Loading } from "./components/ui/primitives";
import AppLayout from "./components/AppLayout";
import Login from "./pages/user/Login";
import Signup from "./pages/user/Signup";
import Dashboard from "./pages/user/Dashboard";
import Sessions from "./pages/session/Sessions";
import SessionData from "./pages/session/SessionData";
import Organizations, { OrganizationDetails } from "./pages/org/Dashboard";
import Join from "./pages/session/Join";
import JoinOrganization from "./pages/org/Join";
const Editor = lazy(() => import("./pages/session/Editor"));

let initialRestore: Promise<boolean> | undefined;
export default function App() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let active = true;
        initialRestore ??= tryRestoreSession();
        void initialRestore.finally(() => {
            if (active) setReady(true);
        });
        return () => {
            active = false;
        };
    }, []);
    if (!ready)
        return (
            <div className="boot-screen">
                <Loading />
            </div>
        );
    return (
        <BrowserRouter>
            <ScrollReset />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<RequireAnon />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Route>
                <Route path="/join/:token" element={<Join />} />
                <Route
                    path="/sessions/:sessionId/editor"
                    element={
                        <Suspense
                            fallback={
                                <div className="boot-screen">
                                    <Loading />
                                </div>
                            }
                        >
                            <Editor />
                        </Suspense>
                    }
                />
                <Route element={<RequireAuth />}>
                    <Route
                        path="/organizations/join/:token"
                        element={<JoinOrganization />}
                    />
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/sessions" element={<Sessions />} />
                        <Route
                            path="/sessions/:sessionId"
                            element={<SessionData />}
                        />
                        <Route
                            path="/organizations"
                            element={<Organizations />}
                        />
                        <Route
                            path="/organizations/:orgId"
                            element={<OrganizationDetails />}
                        />
                    </Route>
                </Route>
                <Route
                    path="*"
                    element={
                        <div className="boot-screen">
                            <EmptyState
                                icon={<span>404</span>}
                                title="A little off the beaten path."
                                action={
                                    <Link
                                        className="button button-primary"
                                        to="/"
                                    >
                                        Back to PairScope
                                    </Link>
                                }
                            >
                                The page you’re looking for isn’t here.
                            </EmptyState>
                        </div>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
function Home() {
    const token = useAuthStore((s) => s.accessToken);
    return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

function ScrollReset() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);
    return null;
}
