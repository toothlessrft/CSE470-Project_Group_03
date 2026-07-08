import { Link } from "react-router-dom";
import { MapPin, ScanSearch, Users, Landmark, Globe2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME } from "../context/AuthContext";

const ROLES = [
  { icon: ScanSearch, label: "Archaeologist / Researcher", description: "Run digs, log finds, verify field reports" },
  { icon: Users, label: "Excavation Team", description: "Keep sites maintained and budgets on track" },
  { icon: Landmark, label: "Government / Admin", description: "Approve requests, assign inspections" },
  { icon: Globe2, label: "Museum Authority", description: "Request artifacts for public exhibition" },
  { icon: MapPin, label: "General Public", description: "Report a newly discovered artifact" },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="hero">
        <span className="hero-eyebrow">Heritage Management System</span>
        <h1 className="hero-title">Protecting history, one discovery at a time</h1>
        <p className="hero-subtitle">
          A centralized platform for managing archaeological excavations, artifact preservation,
          museum collaboration, and public engagement — with map-based discovery logging and
          field inspection tracking built in.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link className="btn" to={ROLE_HOME[user.role] || "/"}>Go to your dashboard</Link>
          ) : (
            <>
              <Link className="btn" to="/login">Log in</Link>
              <Link className="btn btn-outline" to="/register">Create an account</Link>
            </>
          )}
        </div>
      </section>

      <h2 className="section-title">Built for every role</h2>
      <div className="role-grid">
        {ROLES.map(({ icon: Icon, label, description }) => (
          <div className="role-card" key={label}>
            <div className="role-icon">
              <Icon size={22} strokeWidth={2} />
            </div>
            <h4>{label}</h4>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}