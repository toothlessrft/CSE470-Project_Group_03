// Ahad_23201016 - Detailed view of an active excavation project. Reached by
// clicking a project from Manage Projects (archaeologist) or My Projects
// (excavation team); the admin can open it too. Everyone reads the same
// record - the buttons on offer just depend on the role.
import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Gavel,
  MessageCircle,
  Star,
} from "lucide-react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import ArtifactFormModal from "../../components/ArtifactFormModal";
import StatusBadge from "../../components/StatusBadge";
import ReviewModal from "../../components/ReviewModal";

const PROGRESS_COLORS = {
  "Just Started": "#c98a4b",
  "In Progress": "#2980b9",
  "Almost Done": "#27ae60",
  Stalled: "#e03131",
};

const PROGRESS_OPTIONS = ["Just Started", "In Progress", "Almost Done", "Stalled"];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Cross Feedback & Performance Review: whether this user still owes their
  // partner a rating on this project. null until checked (or when the check
  // does not apply, e.g. an admin viewing someone else's dig).
  const [reviewStatus, setReviewStatus] = useState(null);

  function load() {
    setLoading(true);
    api
      .get(`/tenders/projects/${projectId}`)
      .then((data) => {
        setProject(data.project);
        setPermissions(data.permissions);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [projectId]);

  // Only the two people on the dig can rate each other, and only once it is
  // finished - the endpoint rejects anyone else, so don't even ask outside
  // those cases (an admin viewing the page would just get a 403).
  const canReview = Boolean(project?.end_date) && (permissions.isLead || permissions.isTeam);

  const loadReviewStatus = useCallback(() => {
    if (!canReview) {
      setReviewStatus(null);
      return;
    }
    api
      .get(`/reviews/project/${projectId}`)
      .then(setReviewStatus)
      .catch(() => setReviewStatus(null));
  }, [canReview, projectId]);

  useEffect(loadReviewStatus, [loadReviewStatus]);

  async function handleArtifactSubmit(form) {
    setModalError("");
    setModalBusy(true);
    try {
      if (editingArtifact) {
        await api.patch(`/tenders/projects/${projectId}/artifacts/${editingArtifact._id}`, form);
      } else {
        await api.post(`/tenders/projects/${projectId}/artifacts`, form);
      }
      setShowModal(false);
      setEditingArtifact(null);
      setSuccess(editingArtifact ? "Artifact updated." : "Artifact added to this project.");
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalBusy(false);
    }
  }

  async function removeArtifact(itemId) {
    if (!window.confirm("Remove this artifact from the project?")) return;
    try {
      await api.del(`/tenders/projects/${projectId}/artifacts/${itemId}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateProgress(progress) {
    setError("");
    try {
      await api.patch(`/tenders/projects/${projectId}/progress`, { progress });
      setSuccess(`Progress set to "${progress}".`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeProject() {
    if (
      !window.confirm(
        "Mark this excavation as complete? The recovered artifacts will be handed to the Government for allocation, and no further edits will be possible."
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/tenders/projects/${projectId}/complete`, {});
      setSuccess("Project completed and submitted to the Government for artifact allocation.");
      setShowReviewModal(true);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !project) return <div className="page"><p className="hint">Loading project...</p></div>;
  if (!project)
    return (
      <div className="page">
        <div className="alert alert-danger">{error || "Project not found."}</div>
      </div>
    );

  const isComplete = Boolean(project.end_date);

  // "Rate your partner", rendered next to whichever party the current user is
  // entitled to review. Only shown once the dig is finished - there is nothing
  // to rate mid-project, and the API would reject it anyway.
  //
  // Deliberately NOT gated on reviewStatus having loaded: that call is only
  // needed to choose the label, and gating on it means one failed request
  // silently hides the button with no way for the user to tell why. The modal
  // re-fetches the same context itself and reports any real problem.
  const alreadyRated = Boolean(reviewStatus?.already_reviewed);
  const ratePartnerButton = canReview ? (
    <button
      type="button"
      className={alreadyRated ? "btn-small" : "btn"}
      onClick={() => setShowReviewModal(true)}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
      title={alreadyRated ? "You have already rated your partner on this project" : "Rate your partner"}
    >
      <Star size={14} fill={alreadyRated ? "currentColor" : "none"} />
      {alreadyRated ? "Your rating" : "Rate your partner"}
    </button>
  ) : null;

  const canEdit = permissions.canEdit;
  const progressColor = PROGRESS_COLORS[project.progress] || "var(--muted)";
  const team = project.excavation_team;
  const backTo = permissions.isTeam ? "/et/projects" : permissions.isAdmin ? "/admin/excavation-projects" : "/arc/projects";

  const mapValue =
    project.location?.lat != null
      ? project.location
      : project.site?.latitude != null
      ? { lat: project.site.latitude, lng: project.site.longitude, address: project.site.name }
      : null;

  return (
    <div className="page">
      <p>
        <Link to={backTo} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <ArrowLeft size={14} /> Back to projects
        </Link>
      </p>

      <div className="report-header">
        <h1 style={{ margin: 0 }}>{project.p_name}</h1>
        <span
          style={{
            display: "inline-block",
            padding: "0.3rem 0.8rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "white",
            background: isComplete ? "var(--muted)" : progressColor,
            whiteSpace: "nowrap",
          }}
        >
          {isComplete ? "Completed" : project.progress || "Unknown"}
        </span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Ahad_23201016 - the excavation team reads the project; the lead
          archaeologist is the one who records progress, artifacts and handover. */}
      {permissions.isTeam && !isComplete && (
        <div className="alert alert-info">
          You have view-only access to this project. The lead archaeologist records progress,
          artifacts and the final handover.
        </div>
      )}

      {isComplete && (
        <div className="alert alert-info">
          <CheckCircle2 size={15} style={{ verticalAlign: "middle" }} /> This excavation finished on{" "}
          {new Date(project.end_date).toLocaleDateString()}.{" "}
          {project.allocation_done
            ? "All recovered artifacts have been allocated by the Government."
            : "The Government is reviewing the recovered artifacts for allocation."}
        </div>
      )}

      {/* Overview */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Project Overview</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            fontSize: "0.9rem",
          }}
        >
          <div>
            <p className="hint" style={{ margin: 0 }}>Contract Value</p>
            <strong>
              <Banknote size={14} style={{ verticalAlign: "middle" }} /> ৳
              {project.budget != null ? project.budget.toLocaleString() : "—"}
            </strong>
          </div>
          <div>
            <p className="hint" style={{ margin: 0 }}>Started</p>
            <strong>
              <CalendarDays size={14} style={{ verticalAlign: "middle" }} />{" "}
              {project.start_date ? project.start_date.slice(0, 10) : "—"}
            </strong>
          </div>
          <div>
            <p className="hint" style={{ margin: 0 }}>Agreed Timeline</p>
            <strong>
              <Clock size={14} style={{ verticalAlign: "middle" }} />{" "}
              {project.agreed_timeline_days ? `${project.agreed_timeline_days} days` : "—"}
            </strong>
          </div>
          <div>
            <p className="hint" style={{ margin: 0 }}>Site</p>
            <strong>{project.site?.name || "—"}</strong>
          </div>
        </div>

        {project.tender?.project_details && (
          <>
            <h4>Scope of Work</h4>
            <p style={{ fontSize: "0.92rem" }}>{project.tender.project_details}</p>
          </>
        )}
        {project.tender?.requirements && (
          <>
            <h4>Requirements</h4>
            <p style={{ fontSize: "0.92rem" }}>{project.tender.requirements}</p>
          </>
        )}
        {project.completion_notes && (
          <>
            <h4>Handover Notes</h4>
            <p style={{ fontSize: "0.92rem" }}>{project.completion_notes}</p>
          </>
        )}
      </div>

      {/* Location */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          <MapPin size={16} style={{ verticalAlign: "middle" }} /> Excavation Location
        </h3>
        {mapValue ? (
          <>
            <GoogleMapPicker value={mapValue} editable={false} height={260} />
            <p className="hint" style={{ marginBottom: 0 }}>
              {project.location?.address || project.site?.name}
            </p>
          </>
        ) : (
          <p className="hint">No coordinates recorded for this project.</p>
        )}
      </div>

      {/* Excavation team */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
            <Users size={16} style={{ verticalAlign: "middle" }} /> Excavation Team
          </h3>
          {/* Mirror image of the button below: the archaeologist rates the team. */}
          {permissions.isLead && team && ratePartnerButton}
        </div>
        {team ? (
          <table className="table" style={{ marginTop: 0 }}>
            <tbody>
              <tr>
                <th style={{ width: "38%" }}>Company</th>
                <td>{team.company_name}</td>
              </tr>
              <tr>
                <th>Representative</th>
                <td>
                  {team.representative}
                  {team.representative_designation ? ` (${team.representative_designation})` : ""}
                </td>
              </tr>
              <tr>
                <th>Team ID</th>
                <td>{team.nid}</td>
              </tr>
              {team.team_size != null && (
                <tr>
                  <th>Team size</th>
                  <td>{team.team_size} members</td>
                </tr>
              )}
              <tr>
                <th>Contact</th>
                <td>
                  {team.email}
                  {team.phone ? ` · ${team.phone}` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="hint">No excavation team assigned to this project.</p>
        )}

        {project.lead_archaeologist && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h4 style={{ margin: "1rem 0 0.5rem" }}>Lead Archaeologist</h4>
              {/* The excavation team rates the archaeologist, so this button
                  only belongs on their side of the page. */}
              {permissions.isTeam && ratePartnerButton}
            </div>
            <p style={{ fontSize: "0.9rem", margin: 0 }}>
              {project.lead_archaeologist.name} ({project.lead_archaeologist.nid}) —{" "}
              {project.lead_archaeologist.email}
            </p>
          </>
        )}
      </div>

      {/* Progress control */}
      {canEdit && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Update Progress</h3>
          <div className="actions">
            {PROGRESS_OPTIONS.map((p) => (
              <button
                key={p}
                className={project.progress === p ? "btn" : "btn-small"}
                onClick={() => updateProgress(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Artifacts */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ margin: 0 }}>
            <Package size={16} style={{ verticalAlign: "middle" }} /> Artifacts Recovered (
            {project.artifacts?.length || 0})
          </h3>
          {canEdit && (
            <button
              className="btn"
              onClick={() => {
                setEditingArtifact(null);
                setModalError("");
                setShowModal(true);
              }}
            >
              <Plus size={15} /> Add Artifact
            </button>
          )}
        </div>

        {!project.artifacts?.length ? (
          <p className="hint" style={{ margin: 0 }}>
            No artifacts recorded on this excavation yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "0.9rem",
            }}
          >
            {project.artifacts.map((a) => (
              <div key={a._id} className="card" style={{ margin: 0, padding: "0.9rem 1.1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <strong>{a.name}</strong>
                  {a.pending_allocation ? (
                    <StatusBadge status="Pending" />
                  ) : a.allocation === "Auction" ? (
                    <StatusBadge status="Active" />
                  ) : (
                    <StatusBadge status="Approved" />
                  )}
                </div>
                <p className="hint" style={{ margin: "0.2rem 0" }}>{a.Type}</p>
                {a.description && (
                  <p style={{ fontSize: "0.85rem", margin: "0 0 0.4rem" }}>{a.description}</p>
                )}
                <p style={{ fontSize: "0.8rem", color: "#777", margin: 0 }}>
                  {a.civilization && <>Civilization: {a.civilization}<br /></>}
                  {a.era && <>Era: {a.era}<br /></>}
                  {a.region && <>Region: {a.region}<br /></>}
                  {a.material && <>Material: {a.material}<br /></>}
                  {a.usage && <>Usage: {a.usage}<br /></>}
                  {!a.pending_allocation && (
                    <>
                      {a.allocation === "Auction" ? (
                        <>
                          <Gavel size={12} style={{ verticalAlign: "middle" }} /> Sent to auction
                        </>
                      ) : (
                        <>Allocated: {a.museumName || a.location}</>
                      )}
                    </>
                  )}
                </p>

                {canEdit && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button
                      className="btn-small btn-outline"
                      style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                      onClick={() => {
                        setEditingArtifact(a);
                        setModalError("");
                        setShowModal(true);
                      }}
                    >
                      <Edit size={13} /> Edit
                    </button>
                    <button
                      className="btn-small"
                      style={{ color: "#fff", background: "var(--danger)", border: "none" }}
                      onClick={() => removeArtifact(a._id)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finish */}
      {canEdit && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Finish Excavation</h3>
          <p className="hint">
            Completing the project hands every recovered artifact to the Government/Admin, who then
            decides whether each one goes to a museum or to auction.
          </p>
          <button className="btn btn-approve" onClick={completeProject} disabled={busy}>
            <CheckCircle2 size={15} /> {busy ? "Submitting..." : "Complete & Submit to Government"}
          </button>
        </div>
      )}

      <ArtifactFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingArtifact(null);
        }}
        onSubmit={handleArtifactSubmit}
        initial={editingArtifact}
        location={mapValue}
        siteName={project.site?.name}
        busy={modalBusy}
        error={modalError}
      />

      {showReviewModal && (
        <ReviewModal
          projectId={projectId}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={loadReviewStatus}
        />
      )}
    </div>
  );
}
