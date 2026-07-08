import { useEffect, useState } from "react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import StatusBadge from "../../components/StatusBadge";

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

  return (
    <div className="page">
      <h1>My Field Inspection Assignments</h1>
      <p className="hint">Discovery reports the Government/Admin has assigned to you for verification.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <div className="card">No field inspections assigned to you yet.</div>
      ) : (
        reports.map((r) => (
          <div className="card" key={r._id}>
            <div className="report-header">
              <strong>{r.material}</strong>
              <StatusBadge status={r.status} />
            </div>

            <GoogleMapPicker value={r.location} editable={false} height={220} />
            <p className="hint">📍 {r.location?.address || `${r.location.lat}, ${r.location.lng}`}</p>
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
              <div className={`alert ${r.verification?.result === "true" ? "alert-success" : "alert-danger"}`}>
                Verification submitted: {r.verification?.result === "true" ? "Confirmed genuine" : "Could not be verified"}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
