import { useEffect, useState } from "react";
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

  // Current: waiting to verify, or verified true and report not submitted yet
  const currentProjects = reports.filter(
    (r) => r.verification?.result !== "false" && r.researcherReportStatus !== "Submitted"
  );

  // Previous: rejected/unverifiable OR report fully submitted
  const previousProjects = reports.filter(
    (r) => r.verification?.result === "false" || r.researcherReportStatus === "Submitted"
  );

  // Full card for current projects (with map, verification form, report)
  function renderCurrentReport(r) {
    return (
      <div className="card" key={r._id}>
        <div className="report-header">
          <strong>{r.material}</strong>
          <StatusBadge status={r.status} />
        </div>

        <GoogleMapPicker value={r.location} editable={false} height={220} />
        <p className="hint">📍 {r.location?.address || `${r.location?.lat}, ${r.location?.lng}`}</p>
        {r.notes && <p>{r.notes}</p>}
        {r.images?.length > 0 && (
          <div className="image-grid">
            {r.images.map((src, i) => (
              <div className="image-thumb" key={i}>
                <img src={src} alt={`report-${i}`} />
              </div>
            ))}
          </div>
        )}

        <h4>Assignment</h4>
        <p>
          {r.assignment?.budget ? `Suggested budget: ৳${r.assignment.budget}` : "No budget suggested"}
          {r.assignment?.due_date && ` — report due ${new Date(r.assignment.due_date).toLocaleDateString()}`}
        </p>
        {r.assignment?.notes && <p className="hint">Note from admin: {r.assignment.notes}</p>}

        <h4>Reporter contact</h4>
        <p>
          {r.reporter?.name} — ✉️ {r.reporter?.email} 📞 {r.reporter?.phone}
        </p>

        {r.status === "Assigned" ? (
          <div className="form">
            <label>
              Field verification notes
              <textarea
                rows={3}
                value={notesById[r._id] || ""}
                onChange={(e) => setNotesById({ ...notesById, [r._id]: e.target.value })}
                placeholder="What did you find at the site?"
              />
            </label>
            <div className="actions">
              <button
                className="btn btn-approve"
                disabled={busyId === r._id}
                onClick={() => submitVerification(r._id, "true")}
              >
                Confirm Genuine
              </button>
              <button
                className="btn btn-deny"
                disabled={busyId === r._id}
                onClick={() => submitVerification(r._id, "false")}
              >
                Could Not Verify
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            <div className={`alert ${r.verification?.result === "true" ? "alert-success" : "alert-danger"}`}>
              Verification submitted: {r.verification?.result === "true" ? "Confirmed genuine" : "Could not be verified"}
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
    return (
      <div
        key={r._id}
        className="card"
        style={{
          margin: 0,
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          borderLeft: `4px solid ${isRejected ? "var(--danger, #c0392b)" : "var(--success, #27ae60)"}`,
          background: isRejected ? "#fff9f9" : "#f9fff9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <strong style={{ fontSize: "1rem" }}>{r.material}</strong>
          <StatusBadge status={r.status} />
        </div>
        <p className="hint" style={{ margin: 0 }}>
          📍 {r.location?.address || (r.location ? `${r.location.lat}, ${r.location.lng}` : "No location")}
        </p>
        {r.assignment?.due_date && (
          <p className="hint" style={{ margin: 0 }}>
            Due: {new Date(r.assignment.due_date).toLocaleDateString()}
          </p>
        )}
        <div
          style={{
            marginTop: "0.25rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: isRejected ? "var(--danger, #c0392b)" : "var(--success, #27ae60)",
          }}
        >
          {isRejected
            ? "❌ Verification: Could not be verified"
            : "✅ Report Submitted"}
        </div>
        {r.reporter?.name && (
          <p className="hint" style={{ margin: 0, fontSize: "0.8rem" }}>
            Reporter: {r.reporter.name} — {r.reporter.email}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <h1>My Field Inspection Assignments</h1>
      <p className="hint">Discovery reports the Government/Admin has assigned to you for verification.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Current Projects */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ paddingBottom: "0.5rem", borderBottom: "2px solid var(--border)" }}>
              Current Projects
            </h2>
            {currentProjects.length === 0 ? (
              <p className="hint">No current projects.</p>
            ) : (
              currentProjects.map(renderCurrentReport)
            )}
          </div>

          {/* Previous Projects – compact list */}
          <div style={{ marginTop: "3rem" }}>
            <h2 style={{ paddingBottom: "0.5rem", borderBottom: "2px solid var(--border)" }}>
              Previous Assignments
            </h2>
            <p className="hint">Completed verifications and submitted reports.</p>
            {previousProjects.length === 0 ? (
              <p className="hint">No completed or rejected projects yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {previousProjects.map(renderPreviousReport)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
