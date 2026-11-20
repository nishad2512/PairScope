import { Link } from "react-router";
import { ScanLine } from "lucide-react";
export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="PairScope home"
    >
      <span className="brand-icon">
        <ScanLine size={24} strokeWidth={2.2} />
      </span>
      PairScope<span className="brand-dot">.</span>
    </Link>
  );
}
