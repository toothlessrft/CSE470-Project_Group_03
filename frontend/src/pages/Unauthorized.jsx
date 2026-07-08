import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="page narrow">
      <div className="card" style={{ textAlign: "center" }}>
        <div className="auth-icon" style={{ margin: "0 auto 1rem" }}>
          <ShieldAlert size={22} strokeWidth={2} />
        </div>
        <h1>Not authorized</h1>
        <p>You don't have permission to view this page.</p>
        <Link className="btn" to="/">Back to home</Link>
      </div>
    </div>
  );
}