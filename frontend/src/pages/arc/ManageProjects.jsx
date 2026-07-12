import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Users, Map, PackagePlus, Wrench, StopCircle, CalendarDays, Banknote, TrendingUp, FolderKanban, Clock } from "lucide-react";

const PROGRESS_COLORS = {
  "Just Started": "#c98a4b",
  "In Progress": "#2980b9",
  "Almost Done": "#27ae60",
  "Stalled": "#e03131",
};

function ProjectCard({ p, onEnd }) {
  const progressColor = PROGRESS_COLORS[p.progress] || "var(--muted)";
  return (
    <div className="card" style={{ margin: 0, padding: "1.5rem", borderLeft: `4px solid ${progressColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.1rem" }}>{p.p_name}</h3>
          <p className="hint" style={{ margin: 0 }}>
            📍 {p.site?.name || "No site"} &nbsp;·&nbsp; 🏢 {p.organization || "—"}
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
            background: progressColor,
            whiteSpace: "nowrap",
          }}
        >
          {p.progress || "Unknown"}
        </span>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", margin: "1rem 0", fontSize: "0.88rem", color: "var(--muted)" }}>
        {p.budget != null && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Banknote size={15} /> Budget: <strong style={{ color: "var(--text)" }}>৳{p.budget.toLocaleString()}</strong>
          </span>
        )}
        {p.start_date && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <CalendarDays size={15} /> Started: <strong style={{ color: "var(--text)" }}>{p.start_date.slice(0, 10)}</strong>
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        <Link to={`/arc/projects/${p._id}/team`} className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <Users size={13} /> Team
        </Link>
        <Link to={`/arc/projects/${p._id}/site`} className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <Map size={13} /> Edit Site
        </Link>
        <Link to={`/arc/projects/${p._id}/items`} className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <PackagePlus size={13} /> Add Item
        </Link>
        <Link to={`/arc/projects/${p._id}/tools`} className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <Wrench size={13} /> Request Tool
        </Link>
        <button
          className="btn-small"
          style={{ background: "var(--danger)", color: "white", border: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          onClick={() => {
            if (window.confirm(`End project "${p.p_name}"? This cannot be undone.`)) onEnd(p._id);
          }}
        >
          <StopCircle size={13} /> End Project
        </button>
      </div>
    </div>
  );
}

function PastProjectCard({ p }) {
  return (
    <div
      className="card"
      style={{ margin: 0, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", borderLeft: "4px solid var(--border)" }}
    >
      <FolderKanban size={20} style={{ color: "var(--muted)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: "0.98rem" }}>{p.p_name}</strong>
        <p className="hint" style={{ margin: "0.1rem 0 0" }}>
          📍 {p.site?.name || "—"} &nbsp;·&nbsp; 🏢 {p.organization || "—"}
        </p>
      </div>
      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--muted)" }}>
        {p.budget != null && (
          <span><Banknote size={13} style={{ verticalAlign: "middle" }} /> ৳{p.budget.toLocaleString()}</span>
        )}
        {p.start_date && (
          <span><CalendarDays size={13} style={{ verticalAlign: "middle" }} /> {p.start_date.slice(0, 10)}</span>
        )}
        {p.end_date && (
          <span><Clock size={13} style={{ verticalAlign: "middle" }} /> ended {p.end_date.slice(0, 10)}</span>
        )}
      </div>
    </div>
  );
}

export default function ManageProjects() {
  const [ongoing, setOngoing] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/arc/projects")
      .then((data) => {
        setOngoing(data.ongoing_projects);
        setPast(data.past_projects);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function endProject(id) {
    try {
      await api.post(`/arc/projects/${id}/end`);
      load();
    } catch (err) {
      alert(err.message || "Could not end project.");
    }
  }

  if (loading) return <div className="page"><p className="hint">Loading projects...</p></div>;

  return (
    <div className="page">
      <h1>Manage Projects</h1>
      <p className="page-subtitle">View and manage your ongoing excavation projects and past work.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Ongoing */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <TrendingUp size={18} style={{ color: "var(--primary)" }} />
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Ongoing Projects</h2>
        <span style={{ marginLeft: "0.5rem", background: "var(--accent)", color: "white", fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "999px" }}>
          {ongoing.length}
        </span>
      </div>

      {ongoing.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          No active projects. Request an excavation to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
          {ongoing.map((p) => <ProjectCard key={p._id} p={p} onEnd={endProject} />)}
        </div>
      )}

      {/* Past */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "2rem 0 1rem" }}>
        <Clock size={18} style={{ color: "var(--muted)" }} />
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--muted)" }}>Past Projects</h2>
        <span style={{ marginLeft: "0.5rem", background: "var(--border)", color: "var(--muted)", fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "999px" }}>
          {past.length}
        </span>
      </div>

      {past.length === 0 ? (
        <p className="hint">No completed projects yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {past.map((p) => <PastProjectCard key={p._id} p={p} />)}
        </div>
      )}
    </div>
  );
}
