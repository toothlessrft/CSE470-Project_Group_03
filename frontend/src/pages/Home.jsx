import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ScanSearch, Users, Landmark, Globe2, Search, LayoutDashboard, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME } from "../context/AuthContext";
import { api } from "../api";

const ROLES = [
  { icon: ScanSearch, label: "Archaeologist / Researcher", description: "Run digs, log finds, verify field reports" },
  { icon: Users, label: "Excavation Team", description: "Keep sites maintained and budgets on track" },
  { icon: Landmark, label: "Government / Admin", description: "Approve requests, assign inspections" },
  { icon: Globe2, label: "Museum Authority", description: "Request artifacts for public exhibition" },
  { icon: MapPin, label: "General Public", description: "Report a newly discovered artifact" },
];

const ROLE_LABELS = {
  admin: "Admin",
  archaeologist: "Archaeologist",
  museum_manager: "Museum Manager",
  site_caretaker: "Site Caretaker",
  public: "Public Member",
};

export default function Home() {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState([]);

  useEffect(() => {
    api
      .get("/exhibitions?upcoming=true&limit=3")
      .then((data) => setExhibitions(data.exhibitions))
      .catch(() => setExhibitions([]));
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <span className="hero-eyebrow">ArchiveEarth</span>
        <h1 className="hero-title">Protecting history, one discovery at a time</h1>
        <p className="hero-subtitle">
          A centralized platform for managing archaeological excavations, artifact preservation,
          museum collaboration, and public engagement.
        </p>
        <div className="hero-actions">
          {user ? (
            <>
              <Link className="btn" to={ROLE_HOME[user.role] || "/"}>
                <LayoutDashboard size={16} /> My Dashboard ({ROLE_LABELS[user.role] || user.role})
              </Link>
            </>
          ) : (
            <>
              <Link className="btn" to="/login">Log in</Link>
              <Link className="btn btn-outline" to="/register">
                Create an account
              </Link>
            </>
          )}
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

      {exhibitions.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
            <h2 className="section-title" style={{ margin: 0 }}>Upcoming exhibitions & events</h2>
            <Link className="btn-link" to="/exhibitions">
              <CalendarDays size={15} /> See all
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {exhibitions.map((e) => (
              <div className="card" key={e._id} style={{ margin: 0 }}>
                <h4 style={{ margin: "0 0 0.3rem" }}>{e.title}</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#8a7a68" }}>
                 Hosted By {e.museum_name || "Museum"} · {new Date(e.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}