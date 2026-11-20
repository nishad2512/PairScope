import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { GrainGradient } from "@paper-design/shaders-react";
import {
  Code2,
  Eye,
  EyeOff,
  Fingerprint,
  GitBranch,
  Users,
} from "lucide-react";
import { login, signup } from "../../api/auth.api";
import { Button, Field, Notice } from "./primitives";
import Brand from "../Brand";
import { errorMessage } from "../../lib/format";

export default function AuthSectionOne({
  mode = "signup",
}: {
  mode?: "login" | "signup";
}) {
  const signingUp = mode === "signup";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const destination =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    setError("");
    if (signingUp && password !== form.get("confirmPassword")) {
      setError("Your passwords don’t match. Please try again.");
      return;
    }
    setBusy(true);
    try {
      if (signingUp)
        await signup({
          name: String(form.get("name")).trim(),
          email,
          password,
          confirmPassword: String(form.get("confirmPassword")),
        });
      else await login({ email, password });
      navigate(destination, { replace: true });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const switchQuery = next ? `?next=${encodeURIComponent(destination)}` : "";
  return (
    <main className="auth-page">
      <section className="auth-form-panel">
        <Brand />
        <div className="auth-form-content">
          <div className="auth-kicker">
            <span className="tiny-line" />
            BETTER TOGETHER
          </div>
          <h1>
            {signingUp ? "Great minds." : "Welcome back."}
            <br />
            <span>{signingUp ? "One workspace." : "Let’s build."}</span>
          </h1>
          <p className="auth-description">
            {signingUp
              ? "A little less setup. A lot more building. Create your account and find your flow."
              : "Your next great idea starts with a conversation. Sign in to your workspace."}
          </p>
          <form onSubmit={submit} className="form-stack">
            {error && <Notice>{error}</Notice>}
            {signingUp && (
              <Field
                label="Full name"
                name="name"
                placeholder="Alex Morgan"
                autoComplete="name"
                required
                minLength={3}
                maxLength={20}
              />
            )}
            <Field
              label="Email address"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            <div className="password-field">
              <Field
                label="Password"
                name="password"
                type={visible ? "text" : "password"}
                placeholder={
                  signingUp ? "Create a strong password" : "Enter your password"
                }
                autoComplete={signingUp ? "new-password" : "current-password"}
                minLength={signingUp ? 8 : undefined}
                maxLength={signingUp ? 64 : undefined}
                pattern={
                  signingUp
                    ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,64}"
                    : undefined
                }
                title={
                  signingUp
                    ? "Use 8–64 characters with uppercase, lowercase, and a number"
                    : undefined
                }
                hint={
                  signingUp
                    ? "8–64 characters, including uppercase, lowercase, and a number."
                    : undefined
                }
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {signingUp && (
              <Field
                label="Confirm password"
                name="confirmPassword"
                type={visible ? "text" : "password"}
                placeholder="One more time"
                autoComplete="new-password"
                minLength={8}
                required
              />
            )}
            <Button type="submit" busy={busy} className="auth-submit">
              {signingUp ? "Create your account" : "Sign in to PairScope"}
            </Button>
          </form>
          <p className="auth-switch">
            {signingUp ? "Already part of the team?" : "New to PairScope?"}{" "}
            <Link to={`${signingUp ? "/login" : "/signup"}${switchQuery}`}>
              {signingUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <div className="auth-trust">
            <Fingerprint size={16} /> A private space for your best work.
          </div>
        </div>
        <footer className="auth-footer">
          <span>© {new Date().getFullYear()} PairScope</span>
          <span>Built for the way you think.</span>
        </footer>
      </section>
      <aside className="auth-art">
        <div className="auth-gradient" aria-hidden="true">
          <GrainGradient
            colors={["#ffcc93", "#fa742f", "#f46c28", "#ffd8a7"]}
            colorBack="#211a16"
            speed={0.35}
            scale={1.5}
            softness={0.65}
            intensity={0.45}
            noise={0.12}
            shape="corners"
            className="shader"
          />
        </div>
        <div className="art-top">
          <span className="art-label">
            <span /> IN SYNC. IN YOUR ELEMENT.
          </span>
          <GitBranch size={24} />
        </div>
        <div className="art-content">
          <h2>
            Different minds.
            <br />
            Shared momentum.
          </h2>
          <p>
            Interview with intention. Collaborate without friction.
            <br className="desktop-break" /> Make something worth building,
            together.
          </p>
          <div className="collaboration-visual" aria-hidden="true">
            <div className="visual-top">
              <span>
                <span className="live-dot" /> A little shared focus
              </span>
              <span>PAIR / 01</span>
            </div>
            <div className="visual-flow">
              <span className="visual-person">A</span>
              <div className="connection">
                <span />
                <Code2 size={25} />
                <span />
              </div>
              <span className="visual-person second">J</span>
            </div>
            <div className="visual-bottom">
              <span>Two perspectives.</span>
              <span>One possibility.</span>
            </div>
          </div>
        </div>
        <div className="art-footer">
          <span>
            <Users size={17} /> Better work starts with a pair.
          </span>
          <span className="art-pagination">
            <i />
            <i />
            <i />
          </span>
        </div>
      </aside>
    </main>
  );
}
