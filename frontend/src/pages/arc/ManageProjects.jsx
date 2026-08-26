import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import ReviewModal from "../../components/ReviewModal";
import ArtifactFormModal from "../../components/ArtifactFormModal"; // Ahad_23201016
import {
  Users,
  PackagePlus,
  Wrench,
  StopCircle,
  CalendarDays,
  Banknote,
  TrendingUp,
  FolderKanban,
  Clock,
  MapPin,
  Boxes,
  ArrowRight,
} from "lucide-react";

const PROGRESS_COLORS = {
  "Just Started": "#c98a4b",
  "In Progress": "#2980b9",
  "Almost Done": "#27ae60",
  Stalled: "#e03131",
};

function ProjectCard({ p, onEnd, onAddArtifact }) {
  const progressColor = PROGRESS_COLORS[p.progress] || "var(--muted)";

  // Ahad_23201016 - projects awarded through the tender process carry an
  // excavation team and a fixed location; legacy projects don't.
  const team = p.excavation_team;
  const teamName =
    team?.roleProfile?.company_name || team?.roleProfile?.organization || team?.name || null;
  const isTenderProject = Boolean(p.tender);

  return (
    <div className="card" style={{ margin: 0, padding: "1.5rem", borderLeft: `4px solid ${progressColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          {/* Ahad_23201016 - the project name opens the detailed view */}
          <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.1rem" }}>
            <Link
              to={`/arc/projects/${p._id}`}
              style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              {p.p_name}
              <ArrowRight size={15} style={{ color: "var(--accent)" }} />
            </Link>
          </h3>
          <p className="hint" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
            <MapPin size={13} /> {p.site?.name || "No site"}
            <span>&middot;</span>
            <Users size={13} /> {teamName || p.organization || "\u2014"}
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
            <Banknote size={15} /> Budget: <strong style={{ color: "var(--text)" }}>&#2547;{p.budget.toLocaleString()}</strong>
          </span>
        )}
        {p.start_date && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <CalendarDays size={15} /> Started: <strong style={{ color: "var(--text)" }}>{p.start_date.slice(0, 10)}</strong>
          </span>
        )}
        {/* Ahad_23201016 - artifacts recovered so far on this dig */}
        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Boxes size={15} /> Artifacts: <strong style={{ color: "var(--text)" }}>{p.artifacts?.length || 0}</strong>
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        {/* Ahad_23201016 - "Add Item" replaced by "Add Artifacts"; the location
            is taken from the project, so there is no map to fill in by hand. */}
        <button
          className="btn-small"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          onClick={() => onAddArtifact(p)}
        >
          <PackagePlus size={13} /> Add Artifacts
        </button>

        {/* Ahad_23201016 - "Team" is now the awarded excavation team */}
        <Link to={`/arc/projects/${p._id}/team`} className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <Users size={13} /> Excavation Team
        </Link>

        <Link to={`/arc/projects/${p._id}/tools`} className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <Wrench size={13} /> Request Tool
        </Link>

        <button
          className="btn-small"
          style={{ background: "var(--danger)", color: "white", border: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          onClick={() => onEnd(p, isTenderProject)}
        >
          <StopCircle size={13} /> {isTenderProject ? "Complete & Hand Over" : "End Project"}
        </button>
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
        <p className="hint" style={{ margin: "0.1rem 0 0", display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
          <MapPin size={12} /> {p.site?.name || "\u2014"}
          <span>&middot;</span>
          <Users size={12} /> {p.organization || "\u2014"}
        </p>
      </div>
      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--muted)" }}>
        {p.budget != null && (
          <span><Banknote size={13} style={{ verticalAlign: "middle" }} /> &#2547;{p.budget.toLocaleString()}</span>
        )}
        {p.artifacts?.length > 0 && (
          <span><Boxes size={13} style={{ verticalAlign: "middle" }} /> {p.artifacts.length}</span>
        )}
        {p.end_date && (
          <span><Clock size={13} style={{ verticalAlign: "middle" }} /> ended {p.end_date.slice(0, 10)}</span>
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
  const [reviewProjectId, setReviewProjectId] = useState(null);

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

  // Ahad_23201016 - a tender-backed dig gets handed to the Government for
  // artifact allocation; a legacy project just closes as it always did.
  async function endProject(p, isTenderProject) {
    const message = isTenderProject
      ? `Complete "${p.p_name}"? The ${p.artifacts?.length || 0} artifact(s) recovered will be sent to the Government for allocation. This cannot be undone.`
      : `End project "${p.p_name}"? This cannot be undone.`;
    if (!window.confirm(message)) return;

    setError("");
    setSuccess("");
    try {
      if (isTenderProject) {
        const data = await api.post(`/tenders/projects/${p._id}/complete`, {});
        setSuccess(data.message);
        setReviewProjectId(p._id);
      } else {
        await api.post(`/arc/projects/${p._id}/end`);
        setSuccess("Project ended.");
      }

      load();
    } catch (err) {
      setError(err.message || "Could not close the project.");
    }
  }

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
      setSuccess("Artifact logged against the project. It reaches Smart Artifact Search once the Government allocates it.");
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalBusy(false);
    }
  }

  if (loading) return <div className="page"><p className="hint">Loading projects...</p></div>;

  return (
    <div className="page">
      <h1>Manage Projects</h1>
      <p className="page-subtitle">
        Active excavations you are leading, the teams working them, and the artifacts recovered so far.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Ongoing */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <TrendingUp size={18} style={{ color: "var(--primary)" }} />
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Active Projects</h2>
        <span style={{ marginLeft: "0.5rem", background: "var(--accent)", color: "white", fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "999px" }}>
          {ongoing.length}
        </span>
      </div>

      {ongoing.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          No active projects yet. Once you submit a field report requesting an excavation team and the
          Government awards the tender, the dig will appear here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
          {ongoing.map((p) => (
            <ProjectCard key={p._id} p={p} onEnd={endProject} onAddArtifact={openAddArtifact} />
          ))}
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

      {reviewProjectId && (
        <ReviewModal
          projectId={reviewProjectId}
          onClose={() => setReviewProjectId(null)}
          onSubmitted={() => setReviewProjectId(null)}
        />
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
