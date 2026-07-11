import { Link, Navigate } from "react-router-dom";
import { MapPin, ScanSearch, Users, Landmark, Globe2, Search } from "lucide-react";
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

  if (user) {
  return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
}

  return (
    <div className="page">
      <section className="hero">
        <span className="hero-eyebrow">ArchiveEARTH</span>
        <h1 className="hero-title">Protecting history, one discovery at a time</h1>
        <p className="hero-subtitle">
          A centralized platform for managing archaeological excavations, artifact preservation,
          museum collaboration, and public engagement.
        </p>
        <div className="hero-actions">
  <Link className="btn" to="/login">Log in</Link>
  <Link className="btn btn-outline" to="/register">
    Create an account
  </Link>
  <Link className="btn btn-outline" to="/search">
    <Search size={16} /> Search Artifacts
  </Link>
</div>
      </section>

      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 0.4rem" }}>Explore the artifact knowledge hub</h3>
          <p style={{ margin: 0, color: "#8a7a68" }}>
            Search artifacts by civilization, era, region, material, usage, or discovery location - no account needed.
          </p>
        </div>
        <Link className="btn" to="/search">
          <Search size={16} /> Start Searching
        </Link>
      </div>

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