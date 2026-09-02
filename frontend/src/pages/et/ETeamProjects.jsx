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

// Foreground colour for the progress pill; the tint and dot derive from it, so
// state is never carried by colour alone.
const PROGRESS_COLORS = {
  "Just Started": "#8a5a12",
  "In Progress": "#1d4ed8",
  "Almost Done": "#1f6b2e",
  Stalled: "#b02020",
};

const PROGRESS_TINTS = {
  "#8a5a12": "#fdf4e3",
  "#1d4ed8": "#eef3fd",
  "#1f6b2e": "#eef9f0",
  "#b02020": "#fdeeee",
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
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your projects
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Awarded contracts</span>
          <h1>Project register</h1>
          <p className="page-subtitle">
            Excavations your company holds under the government tender process.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="section-head">
        <h2>
          <TrendingUp size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
          Active projects
        </h2>
        <span className="hint">{ongoing.length} in progress</span>
      </div>

      {ongoing.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={24} aria-hidden="true" />
          <h3>No active projects</h3>
          <p>Projects appear here once the heritage authority awards you a tender.</p>
          <Link className="btn" to="/et/tenders">
            Browse open tenders
          </Link>
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
                  borderLeft: `3px solid ${color}`,
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div className="report-header">
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.2rem" }}>{p.p_name}</h3>
                    <p className="meta-row">
                      <span>
                        <MapPin size={13} aria-hidden="true" />{" "}
                        {p.site?.name || p.location?.address || "No site recorded"}
                      </span>
                    </p>
                  </div>
                  <span
                    className="status-badge"
                    style={{ color, backgroundColor: PROGRESS_TINTS[color] || "#f7f3ec" }}
                  >
                    {p.progress || "Status unknown"}
                  </span>
                </div>

                <dl className="detail-list" style={{ margin: "1.1rem 0 0" }}>
                  {p.budget != null && (
                    <div>
                      <dt>
                        <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Contract value
                      </dt>
                      <dd className="num">৳{p.budget.toLocaleString()}</dd>
                    </div>
                  )}
                  {p.start_date && (
                    <div>
                      <dt>
                        <CalendarDays size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Commenced
                      </dt>
                      <dd className="num">{p.start_date.slice(0, 10)}</dd>
                    </div>
                  )}
                  {p.agreed_timeline_days && (
                    <div>
                      <dt>
                        <Clock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Agreed duration
                      </dt>
                      <dd className="num">{p.agreed_timeline_days} days</dd>
                    </div>
                  )}
                  <div>
                    <dt>
                      <Package size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Artifacts recovered
                    </dt>
                    <dd className="num">{p.artifacts?.length || 0}</dd>
                  </div>
                </dl>

                <p
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    margin: "1rem 0 0",
                    color: "var(--primary)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Open project <ArrowRight size={14} aria-hidden="true" />
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="section-head">
        <h2>
          <Clock size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--muted)" }} />
          Completed projects
        </h2>
        <span className="hint">{past.length} closed</span>
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
                padding: "0.95rem 1.2rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <FolderKanban size={18} style={{ color: "var(--muted-soft)", flexShrink: 0 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "0.9375rem" }}>{p.p_name}</strong>
                <p className="record-meta">
                  {p.site?.name || "No site recorded"} · {p.artifacts?.length || 0} artifacts recovered
                </p>
              </div>
              <span className="hint">
                {p.end_date && <>Closed {p.end_date.slice(0, 10)}</>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
