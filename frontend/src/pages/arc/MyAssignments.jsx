import { useEffect, useState } from "react";
import { MapPin, Mail, Phone, ClipboardList, Info, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import StatusBadge from "../../components/StatusBadge";
import ResearcherReportDraft from "./ResearcherReportDraft"; //Researcher Report: Ahad

export default function MyAssignments() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notesById, setNotesById] = useState({});
  const [busyId, setBusyId] = useState(null);
  // Which previous assignment is expanded in the "View details" panel
  const [expandedId, setExpandedId] = useState(null);

  function load() {
    setLoading(true);
    api
      .get("/arc/assignments")
      .then((data) => setReports(data.reports))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submitVerification(id, result) {
    setError("");
    setBusyId(id);
    try {
      await api.post(`/arc/assignments/${id}/verify`, {
        result,
        notes: notesById[id] || "",
      });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Current: not yet verified, or verified with the report still a draft.
  const isFinished = (r) =>
    r.verification?.result === "false" ||
    r.researcherReportStatus === "Pending" ||
    r.researcherReportStatus === "Approved";

  const currentProjects = reports.filter((r) => !isFinished(r));

  // Previous: rejected, unverifiable, or the report is submitted.
  const previousProjects = reports.filter(isFinished);

  // Full card for current projects (with map, verification form, report)
  function renderCurrentReport(r) {
    return (
      <div className="card" key={r._id}>
        <div className="report-header">
          <h3 style={{ margin: 0 }}>{r.material}</h3>
          <StatusBadge status={r.status} />
        </div>

        <GoogleMapPicker value={r.location} editable={false} height={220} />
        <p className="meta-row">
          <span>
            <MapPin size={13} aria-hidden="true" />
            {r.location?.address || `${r.location?.lat}, ${r.location?.lng}`}
          </span>
        </p>
        {r.notes && <p>{r.notes}</p>}
        {r.images?.length > 0 && (
          <div className="image-grid">
            {r.images.map((src, i) => (
              <div className="image-thumb" key={i}>
                <img src={src} alt={`Photograph ${i + 1} of the reported find`} />
              </div>
            ))}
          </div>
        )}

        <h4 className="section-title" style={{ marginTop: "1.5rem" }}>
          Assignment
        </h4>
        <p className="hint">
          {r.assignment?.due_date
            ? `Field report due ${new Date(r.assignment.due_date).toLocaleDateString()}`
            : "No due date set"}
        </p>
        {r.assignment?.notes && (
          <div className="alert alert-info" style={{ whiteSpace: "pre-wrap" }}>
            <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              <strong style={{ display: "block", marginBottom: "0.15rem" }}>
                Instruction from the heritage authority
              </strong>
              {r.assignment.notes}
            </span>
          </div>
        )}

        <h4 className="section-title">Reporter contact</h4>
        <p className="meta-row">
          <span>{r.reporter?.name}</span>
          <span>
            <Mail size={13} aria-hidden="true" /> {r.reporter?.email}
          </span>
          <span>
            <Phone size={13} aria-hidden="true" /> {r.reporter?.phone}
          </span>
        </p>

        {r.status === "Assigned" ? (
          <div className="form">
            <label>
              Field verification notes
              <textarea
                rows={3}
                value={notesById[r._id] || ""}
                onChange={(e) => setNotesById({ ...notesById, [r._id]: e.target.value })}
                placeholder="Condition of the site, what was visible, and how the find relates to its context"
              />
            </label>
            <div className="actions">
              <button
                className="btn btn-approve"
                disabled={busyId === r._id}
                onClick={() => submitVerification(r._id, "true")}
              >
                Confirm as genuine
              </button>
              <button
                className="btn btn-deny"
                disabled={busyId === r._id}
                onClick={() => submitVerification(r._id, "false")}
              >
                Record as unverified
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            <div className={`alert ${r.verification?.result === "true" ? "alert-success" : "alert-danger"}`}>
              Verification recorded:{" "}
              {r.verification?.result === "true" ? "confirmed as genuine" : "could not be verified"}.
            </div>
            {r.verification?.result === "true" && (
              <ResearcherReportDraft discoveryId={r._id} onSubmitted={load} />
            )}
          </div>
        )}
      </div>
    );
  }

  // Compact summary card for previous/completed projects
  function renderPreviousReport(r) {
    const isRejected = r.verification?.result === "false";
    const isSubmitted = r.researcherReportStatus === "Pending";
    const expanded = expandedId === r._id;
    return (
      <div
        key={r._id}
        className="card"
        style={{
          margin: 0,
          borderLeft: `3px solid ${isRejected ? "var(--danger)" : "var(--success)"}`,
        }}
      >
        <div className="report-header">
          <h4 style={{ margin: 0 }}>{r.material}</h4>
          <StatusBadge status={r.status} />
        </div>

        <p className="meta-row">
          <span>
            <MapPin size={13} aria-hidden="true" />
            {r.location?.address ||
              (r.location ? `${r.location.lat}, ${r.location.lng}` : "No location recorded")}
          </span>
          {r.assignment?.due_date && (
            <span>Due {new Date(r.assignment.due_date).toLocaleDateString()}</span>
          )}
          {r.reporter?.name && <span>Reported by {r.reporter.name}</span>}
        </p>

        <p
          style={{
            margin: "0.6rem 0 0",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: isRejected ? "var(--danger)" : "var(--success)",
          }}
        >
          {isRejected
            ? "Could not be verified"
            : isSubmitted
            ? "Field report submitted — awaiting authority approval"
            : "Field report approved"}
        </p>

        {/* Previous assignments are read-only, but the full record is still
            available on demand. */}
        <div style={{ marginTop: "0.75rem" }}>
          <button
            className="btn-small btn-secondary"
            onClick={() => setExpandedId(expanded ? null : r._id)}
          >
            {expanded ? (
              <>
                <ChevronUp size={13} aria-hidden="true" /> Hide record
              </>
            ) : (
              <>
                <ChevronDown size={13} aria-hidden="true" /> View full record
              </>
            )}
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: "0.5rem" }}>
            <GoogleMapPicker value={r.location} editable={false} height={200} />
            {r.notes && <p style={{ marginBottom: 0 }}>{r.notes}</p>}
            {r.images?.length > 0 && (
              <div className="image-grid">
                {r.images.map((src, i) => (
                  <div className="image-thumb" key={i}>
                    <img src={src} alt={`Photograph ${i + 1} of the reported find`} />
                  </div>
                ))}
              </div>
            )}

            <h4 className="section-title">Assignment</h4>
            <p className="hint" style={{ margin: 0 }}>
              {r.assignment?.due_date
                ? `Field report due ${new Date(r.assignment.due_date).toLocaleDateString()}`
                : "No due date recorded"}
            </p>
            {r.assignment?.notes && (
              <p style={{ margin: "0.35rem 0 0" }}>
                <strong>Instruction from the heritage authority:</strong> {r.assignment.notes}
              </p>
            )}

            <h4 className="section-title">Field verification</h4>
            <p style={{ margin: 0 }}>
              {isRejected ? "Could not be verified" : "Confirmed genuine"}
              {r.verification?.notes ? ` — ${r.verification.notes}` : ""}
            </p>

            {!isRejected && <ResearcherReportDraft discoveryId={r._id} onSubmitted={load} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Field work</span>
          <h1>Inspection assignments</h1>
          <p className="page-subtitle">
            Discovery reports referred to you by the heritage authority for verification, and the
            field reports you have filed.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your assignments
        </div>
      ) : (
        <>
          <div className="section-head">
            <h2>Open assignments</h2>
            <span className="hint">{currentProjects.length} awaiting your attention</span>
          </div>
          {currentProjects.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={24} aria-hidden="true" />
              <h3>No open assignments</h3>
              <p>New inspections referred to you will appear here.</p>
            </div>
          ) : (
            currentProjects.map(renderCurrentReport)
          )}

          <div className="section-head">
            <h2>Completed assignments</h2>
            <span className="hint">Verifications closed and reports filed</span>
          </div>
          {previousProjects.length === 0 ? (
            <p className="hint">Nothing completed yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {previousProjects.map(renderPreviousReport)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
