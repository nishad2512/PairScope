import { CodeXml } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand() {
  return <Link to="/" className="brand"><span><CodeXml size={20} aria-hidden="true" /></span>PairScope</Link>;
}
