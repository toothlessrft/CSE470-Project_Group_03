// Ahad_23201016 - one excavation project in detail. Opened from Manage
// Projects (archaeologist), My Projects (team), or by the admin. Everyone
// reads the same record; only the buttons differ by role.
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

  // Whether this user still owes their partner a rating. null until checked,
  // or when it does not apply (an admin viewing someone else's dig).
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

  // Only the two parties on a finished dig can rate each other, so don't ask
  // outside that case - anyone else gets a 403.
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
      setSuccess(
        editingArtifact ? "Artifact record updated." : "Artifact catalogued against this project."
      );
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalBusy(false);
    }
  }

  async function removeArtifact(itemId) {
    if (!window.confirm("Remove this artifact from the project catalogue?")) return;
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
      setSuccess(`Progress recorded as "${progress}".`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeProject() {
    if (
      !window.confirm(
        "Close this excavation? Every recovered artifact passes to the heritage authority for allocation, and the record becomes read-only."
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/tenders/projects/${projectId}/complete`, {});
      setSuccess("Excavation closed and submitted to the heritage authority for allocation.");
      setShowReviewModal(true);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !project)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading project record
        </div>
      </div>
    );
  if (!project)
    return (
      <div className="page">
        <div className="alert alert-danger">{error || "This project could not be found."}</div>
      </div>
    );

  const isComplete = Boolean(project.end_date);

  // "Rate your partner", shown beside whichever party this user may review,
  // and only once the dig is finished. Not gated on reviewStatus loading -
  // that call only picks the label, and gating on it would hide the button
  // silently if it failed. The modal re-checks and reports real problems.
  const alreadyRated = Boolean(reviewStatus?.already_reviewed);
  const ratePartnerButton = canReview ? (
    <button
      type="button"
      className={alreadyRated ? "btn-small" : "btn"}
      onClick={() => setShowReviewModal(true)}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
      title={
        alreadyRated
          ? "You have already assessed your collaborator on this project"
          : "Assess your collaborator"
      }
    >
      <Star size={14} fill={alreadyRated ? "currentColor" : "none"} aria-hidden="true" />
      {alreadyRated ? "Your assessment" : "Assess collaborator"}
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
      <Link className="back-link" to={backTo}>
        <ArrowLeft size={14} aria-hidden="true" /> Back to projects
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Excavation project</span>
          <h1>{project.p_name}</h1>
        </div>
        <div className="actions">
          {team && (
            <Link to={`/chats/${project._id}`} className="btn btn-small btn-secondary">
              <MessageCircle size={14} aria-hidden="true" /> Project channel
            </Link>
          )}
          <span
            className="status-badge"
            style={
              isComplete
                ? { color: "#6f6254", backgroundColor: "#f7f3ec" }
                : { color: progressColor, backgroundColor: PROGRESS_TINTS[progressColor] || "#f7f3ec" }
            }
          >
            {isComplete ? "Closed" : project.progress || "Status unknown"}
          </span>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Ahad_23201016 - the excavation team reads the project; the lead
          archaeologist is the one who records progress, artifacts and handover. */}
      {permissions.isTeam && !isComplete && (
        <div className="alert alert-info">
          You have read-only access to this record. The lead archaeologist records progress,
          catalogues artifacts, and files the final handover.
        </div>
      )}

      {isComplete && (
        <div className="alert alert-info">
          <CheckCircle2 size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            This excavation closed on {new Date(project.end_date).toLocaleDateString()}.{" "}
            {project.allocation_done
              ? "All recovered artifacts have been allocated by the heritage authority."
              : "The heritage authority is reviewing the recovered artifacts for allocation."}
          </span>
        </div>
      )}

      {/* Overview */}
      <div className="panel">
        <div className="panel-head">
          <h3>Contract summary</h3>
        </div>
        <div className="panel-body">
          <dl className="detail-list">
            <div>
              <dt>
                <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Contract value
              </dt>
              <dd className="num">
                {project.budget != null ? `৳${project.budget.toLocaleString()}` : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Commenced
              </dt>
              <dd className="num">
                {project.start_date ? project.start_date.slice(0, 10) : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>
                <Clock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Agreed duration
              </dt>
              <dd className="num">
                {project.agreed_timeline_days ? `${project.agreed_timeline_days} days` : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>Site</dt>
              <dd>{project.site?.name || "Not recorded"}</dd>
            </div>
          </dl>

          {project.tender?.project_details && (
            <>
              <h4 className="section-title">Scope of work</h4>
              <p style={{ fontSize: "0.9375rem", marginBottom: 0 }}>{project.tender.project_details}</p>
            </>
          )}
          {project.tender?.requirements && (
            <>
              <h4 className="section-title">Requirements</h4>
              <p style={{ fontSize: "0.9375rem", marginBottom: 0 }}>{project.tender.requirements}</p>
            </>
          )}
          {project.completion_notes && (
            <>
              <h4 className="section-title">Handover notes</h4>
              <p style={{ fontSize: "0.9375rem", marginBottom: 0 }}>{project.completion_notes}</p>
            </>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            <MapPin size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.35rem" }} />
            Site location
          </h3>
        </div>
        <div className="panel-body">
          {mapValue ? (
            <>
              <GoogleMapPicker value={mapValue} editable={false} height={260} />
              <p className="hint" style={{ margin: "0.6rem 0 0" }}>
                {project.location?.address || project.site?.name}
              </p>
            </>
          ) : (
            <p className="hint" style={{ margin: 0 }}>
              No coordinates are recorded for this project.
            </p>
          )}
        </div>
      </div>

      {/* Excavation contractor */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            <Users size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.35rem" }} />
            Excavation contractor
          </h3>
          {/* Mirrors the button below: the archaeologist rates the contractor. */}
          {permissions.isLead && team && ratePartnerButton}
        </div>
        <div className="panel-body">
          {team ? (
            <table className="table" style={{ margin: 0 }}>
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
                  <th>Registration number</th>
                  <td className="num">{team.nid}</td>
                </tr>
                {team.team_size != null && (
                  <tr>
                    <th>Field crew</th>
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
            <p className="hint" style={{ margin: 0 }}>
              No contractor has been awarded this project.
            </p>
          )}

          {project.lead_archaeologist && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <h4 className="section-title" style={{ flex: 1 }}>
                  Lead archaeologist
                </h4>
                {/* The contractor assesses the archaeologist, so this button
                    only belongs on their side of the page. */}
                {permissions.isTeam && ratePartnerButton}
              </div>
              <p style={{ fontSize: "0.9375rem", margin: 0 }}>
                {project.lead_archaeologist.name} ({project.lead_archaeologist.nid}) —{" "}
                {project.lead_archaeologist.email}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Progress control */}
      {canEdit && (
        <div className="panel">
          <div className="panel-head">
            <h3>Record progress</h3>
          </div>
          <div className="panel-body">
            <div className="actions">
              {PROGRESS_OPTIONS.map((p) => (
                <button
                  key={p}
                  className={project.progress === p ? "btn btn-small" : "btn btn-small btn-secondary"}
                  aria-pressed={project.progress === p}
                  onClick={() => updateProgress(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Artifacts */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            <Package size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.35rem" }} />
            Artifacts recovered ({project.artifacts?.length || 0})
          </h3>
          {canEdit && (
            <button
              className="btn btn-small"
              onClick={() => {
                setEditingArtifact(null);
                setModalError("");
                setShowModal(true);
              }}
            >
              <Plus size={14} aria-hidden="true" /> Catalogue artifact
            </button>
          )}
        </div>

        <div className="panel-body">
          {!project.artifacts?.length ? (
            <p className="hint" style={{ margin: 0 }}>
              No artifacts have been catalogued on this excavation yet.
            </p>
          ) : (
            <div className="artifact-grid">
              {project.artifacts.map((a) => (
                <div key={a._id} className="artifact-tile">
                  <div className="artifact-tile-head">
                    <strong>{a.name}</strong>
                    {a.pending_allocation ? (
                      <StatusBadge status="Pending" />
                    ) : a.allocation === "Auction" ? (
                      <StatusBadge status="Active" />
                    ) : (
                      <StatusBadge status="Approved" />
                    )}
                  </div>
                  <p className="artifact-tile-class">{a.Type}</p>
                  {a.description && <p className="artifact-tile-desc">{a.description}</p>}

                  <dl className="artifact-tile-facts">
                    {a.civilization && (
                      <div>
                        <dt>Civilization</dt>
                        <dd>{a.civilization}</dd>
                      </div>
                    )}
                    {a.era && (
                      <div>
                        <dt>Era</dt>
                        <dd>{a.era}</dd>
                      </div>
                    )}
                    {a.region && (
                      <div>
                        <dt>Region</dt>
                        <dd>{a.region}</dd>
                      </div>
                    )}
                    {a.material && (
                      <div>
                        <dt>Material</dt>
                        <dd>{a.material}</dd>
                      </div>
                    )}
                    {a.usage && (
                      <div>
                        <dt>Use</dt>
                        <dd>{a.usage}</dd>
                      </div>
                    )}
                    {!a.pending_allocation && (
                      <div>
                        <dt>Allocation</dt>
                        <dd>
                          {a.allocation === "Auction" ? (
                            <>
                              <Gavel size={12} aria-hidden="true" style={{ verticalAlign: "-1px" }} />{" "}
                              Released to auction
                            </>
                          ) : (
                            a.museumName || a.location
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {canEdit && (
                    <div className="actions" style={{ marginTop: "0.75rem" }}>
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => {
                          setEditingArtifact(a);
                          setModalError("");
                          setShowModal(true);
                        }}
                      >
                        <Edit size={13} aria-hidden="true" /> Edit
                      </button>
                      <button className="btn-small btn-danger" onClick={() => removeArtifact(a._id)}>
                        <Trash2 size={13} aria-hidden="true" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Finish */}
      {canEdit && !isComplete && (
        <div className="panel">
          <div className="panel-head">
            <h3>Close the excavation</h3>
          </div>
          <div className="panel-body">
            <p className="hint" style={{ marginTop: 0 }}>
              Closing hands every recovered artifact to the heritage authority, which then decides
              whether each one is allocated to a museum or released to auction. The record becomes
              read-only.
            </p>
            <button className="btn btn-approve" onClick={completeProject} disabled={busy}>
              <CheckCircle2 size={15} aria-hidden="true" />{" "}
              {busy ? "Submitting" : "Close and submit for allocation"}
            </button>
          </div>
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
