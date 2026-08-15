// Ahad_23201016 - Manage Projects for the excavation team. The same awarded
// project also shows in the archaeologist's Manage Projects.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Banknote,
  CalendarDays,
  Clock,
  Package,
  TrendingUp,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { api } from "../../api";

const PROGRESS_COLORS = {
  "Just Started": "#c98a4b",
  "In Progress": "#2980b9",
  "Almost Done": "#27ae60",
  Stalled: "#e03131",
};

export default function ETeamProjects() {
  const [ongoing, setOngoing] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/tenders/my-projects")
      .then((data) => {
        setOngoing(data.ongoing_projects);
        setPast(data.past_projects);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page">
        <p className="hint">Loading projects...</p>
      </div>
    );

  return (
    <div className="page">
      <h1>Manage Projects</h1>
      <p className="page-subtitle">
        Excavations your company has been awarded through the government tender process.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <TrendingUp size={18} style={{ color: "var(--primary)" }} />
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Active Projects</h2>
        <span
          style={{
            marginLeft: "0.5rem",
            background: "var(--accent)",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "0.15rem 0.6rem",
            borderRadius: "999px",
          }}
        >
          {ongoing.length}
        </span>
      </div>

      {ongoing.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          No active projects. Win a tender to get started —{" "}
          <Link to="/et/tenders">browse open tenders</Link>.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
          {ongoing.map((p) => {
            const color = PROGRESS_COLORS[p.progress] || "var(--muted)";
            return (
              <Link
                key={p._id}
                to={`/et/projects/${p._id}`}
                className="card"
                style={{
                  margin: 0,
                  padding: "1.5rem",
                  borderLeft: `4px solid ${color}`,
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.1rem" }}>{p.p_name}</h3>
                    <p className="hint" style={{ margin: 0 }}>
                      <MapPin size={13} style={{ verticalAlign: "middle" }} />{" "}
                      {p.site?.name || p.location?.address || "No site"}
                    </p>
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "white",
                      background: color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.progress || "Unknown"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                    margin: "1rem 0 0",
                    fontSize: "0.88rem",
                    color: "var(--muted)",
                  }}
                >
                  {p.budget != null && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Banknote size={15} /> ৳{p.budget.toLocaleString()}
                    </span>
                  )}
                  {p.start_date && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <CalendarDays size={15} /> Started {p.start_date.slice(0, 10)}
                    </span>
                  )}
                  {p.agreed_timeline_days && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Clock size={15} /> {p.agreed_timeline_days} days agreed
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Package size={15} /> {p.artifacts?.length || 0} artifact
                    {(p.artifacts?.length || 0) === 1 ? "" : "s"}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      color: "var(--primary)",
                      fontWeight: 600,
                    }}
                  >
                    Open project <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "2rem 0 1rem" }}>
        <Clock size={18} style={{ color: "var(--muted)" }} />
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--muted)" }}>Completed Projects</h2>
        <span
          style={{
            marginLeft: "0.5rem",
            background: "var(--border)",
            color: "var(--muted)",
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "0.15rem 0.6rem",
            borderRadius: "999px",
          }}
        >
          {past.length}
        </span>
      </div>

      {past.length === 0 ? (
        <p className="hint">No completed projects yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {past.map((p) => (
            <Link
              key={p._id}
              to={`/et/projects/${p._id}`}
              className="card"
              style={{
                margin: 0,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                borderLeft: "4px solid var(--border)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <FolderKanban size={20} style={{ color: "var(--muted)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "0.98rem" }}>{p.p_name}</strong>
                <p className="hint" style={{ margin: "0.1rem 0 0" }}>
                  {p.site?.name || "—"} · {p.artifacts?.length || 0} artifacts recovered
                </p>
              </div>
              <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                {p.end_date && <>ended {p.end_date.slice(0, 10)}</>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
