import { AlertCircle, LoaderCircle } from "lucide-react";

export function Loading({ label }: { label: string }) {
  return <div className="feedback" role="status"><LoaderCircle className="animate-spin" size={20} aria-hidden="true" />{label}</div>;
}

export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="feedback error" role="alert">
      <AlertCircle size={22} aria-hidden="true" />
      <p>{message}</p>
      <button className="button secondary" onClick={retry}>Try again</button>
    </div>
  );
}
