import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import ArtifactFormModal from "../../components/ArtifactFormModal"; // Ahad_23201016
import {
  Users,
  PackagePlus,
  Wrench,
  CalendarDays,
  Banknote,
  TrendingUp,
  FolderKanban,
  Clock,
  MapPin,
  Boxes,
  ArrowRight,
} from "lucide-react";

// Foreground colour for the progress pill; the tint and dot are derived from
// it, so state never depends on colour alone.
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

function ProjectCard({ p, onAddArtifact }) {
  const progressColor = PROGRESS_COLORS[p.progress] || "var(--muted)";

  // Ahad_23201016 - projects awarded through the tender process carry an
  // excavation team and a fixed location; legacy projects don't.
  const team = p.excavation_team;
  const teamName =
    team?.roleProfile?.company_name || team?.roleProfile?.organization || team?.name || null;

  return (
    <div className="card" style={{ margin: 0, borderLeft: `3px solid ${progressColor}` }}>
      <div className="report-header">
        <div style={{ minWidth: 0 }}>
          {/* Ahad_23201016 - the project name opens the detailed view */}
          <h3 style={{ margin: "0 0 0.2rem" }}>
            <Link
              to={`/arc/projects/${p._id}`}
              style={{
                color: "inherit",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {p.p_name}
              <ArrowRight size={15} style={{ color: "var(--accent)" }} aria-hidden="true" />
            </Link>
          </h3>
          <p className="meta-row">
            <span>
              <MapPin size={13} aria-hidden="true" /> {p.site?.name || "No site recorded"}
            </span>
            <span>
              <Users size={13} aria-hidden="true" /> {teamName || p.organization || "Team not assigned"}
            </span>
          </p>
        </div>
        <span
          className="status-badge"
          style={{ color: progressColor, backgroundColor: PROGRESS_TINTS[progressColor] || "#f7f3ec" }}
        >
          {p.progress || "Status unknown"}
        </span>
      </div>

      <dl className="detail-list" style={{ margin: "1.1rem 0" }}>
        {p.budget != null && (
          <div>
            <dt>
              <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Budget
            </dt>
            <dd className="num">&#2547;{p.budget.toLocaleString()}</dd>
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
        {/* Ahad_23201016 - artifacts recovered so far on this dig */}
        <div>
          <dt>
            <Boxes size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Artifacts recovered
          </dt>
          <dd className="num">{p.artifacts?.length || 0}</dd>
        </div>
      </dl>

      <div
        className="actions"
        style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
      >
        {/* Ahad_23201016 - "Add Item" replaced by "Catalogue artifact"; the
            location is taken from the project, so there is no map to fill in. */}
        <button className="btn-small" onClick={() => onAddArtifact(p)}>
          <PackagePlus size={13} aria-hidden="true" /> Catalogue artifact
        </button>

        {/* Ahad_23201016 - "Team" is now the awarded excavation team */}
        <Link to={`/arc/projects/${p._id}/team`} className="btn-small btn-secondary">
          <Users size={13} aria-hidden="true" /> Field team
        </Link>

        <Link to={`/arc/projects/${p._id}/tools`} className="btn-small btn-secondary">
          <Wrench size={13} aria-hidden="true" /> Request equipment
        </Link>
      </div>
    </div>
  );
}

function PastProjectCard({ p }) {
  return (
    <Link
      to={`/arc/projects/${p._id}`}
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
        <p className="meta-row">
          <span>
            <MapPin size={12} aria-hidden="true" /> {p.site?.name || "No site recorded"}
          </span>
          <span>
            <Users size={12} aria-hidden="true" /> {p.organization || "Team not recorded"}
          </span>
        </p>
      </div>
      <div className="meta-row" style={{ margin: 0 }}>
        {p.budget != null && (
          <span>
            <Banknote size={13} aria-hidden="true" /> &#2547;{p.budget.toLocaleString()}
          </span>
        )}
        {p.artifacts?.length > 0 && (
          <span>
            <Boxes size={13} aria-hidden="true" /> {p.artifacts.length} artifacts
          </span>
        )}
        {p.end_date && (
          <span>
            <Clock size={13} aria-hidden="true" /> Closed {p.end_date.slice(0, 10)}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function ManageProjects() {
  const navigate = useNavigate();
  const [ongoing, setOngoing] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ahad_23201016 - Add Artifact modal state
  const [artifactProject, setArtifactProject] = useState(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");

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

  function openAddArtifact(p) {
    if (!p.tender) {
      // Legacy projects have no tender-fixed location, so keep them on the
      // original Add Item screen rather than guessing coordinates.
      navigate(`/arc/projects/${p._id}/items`);
      return;
    }
    setModalError("");
    setArtifactProject(p);
  }

  async function handleAddArtifact(form) {
    setModalError("");
    setModalBusy(true);
    try {
      await api.post(`/tenders/projects/${artifactProject._id}/artifacts`, form);
      setArtifactProject(null);
      setSuccess(
        "Artifact catalogued against the project. It enters the public catalogue once the heritage authority allocates it."
      );
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalBusy(false);
    }
  }

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
          <span className="eyebrow">Excavations</span>
          <h1>Project register</h1>
          <p className="page-subtitle">
            The excavations you are directing, the contractors working them, and the artifacts
            recovered so far.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Ongoing */}
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
          <h3>No active excavations</h3>
          <p>
            Once you file a field report recommending an excavation and the heritage authority
            awards the tender, the project appears here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
          {ongoing.map((p) => (
            <ProjectCard key={p._id} p={p} onAddArtifact={openAddArtifact} />
          ))}
        </div>
      )}

      {/* Past */}
      <div className="section-head">
        <h2>
          <Clock size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--muted)" }} />
          Closed projects
        </h2>
        <span className="hint">{past.length} completed</span>
      </div>

      {past.length === 0 ? (
        <p className="hint">No completed projects yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {past.map((p) => <PastProjectCard key={p._id} p={p} />)}
        </div>
      )}

      {/* Ahad_23201016 - Add Artifact, location fixed to the reported site */}
      <ArtifactFormModal
        open={Boolean(artifactProject)}
        onClose={() => setArtifactProject(null)}
        onSubmit={handleAddArtifact}
        location={artifactProject?.location}
        siteName={artifactProject?.site?.name}
        busy={modalBusy}
        error={modalError}
      />
    </div>
  );
}
