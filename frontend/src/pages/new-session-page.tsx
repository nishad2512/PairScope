import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { SessionForm } from "@/components/sessions/session-form";

export function NewSessionPage() {
  return (
    <>
      <div className="page-heading">
        <Link className="text-link back-link" to="/sessions"><ArrowLeft size={16} aria-hidden="true" />Sessions</Link>
        <h1>New session</h1>
        <p className="muted">Start now or schedule a time to work together.</p>
      </div>
      <SessionForm />
    </>
  );
}
