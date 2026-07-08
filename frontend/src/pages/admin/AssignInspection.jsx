import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import StatusBadge from "../../components/StatusBadge";

export default function AssignInspection() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [researchers, setResearchers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [researcherId, setResearcherId] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/admin/reports/${id}`)
      .then((data) => {
        setReport(data.report);
        return api.get(`/admin/researchers?lat=${data.report.location.lat}&lng=${data.report.location.lng}`);
      })
      .then((data) => setResearchers(data.researchers))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAssign(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!researcherId || !dueDate) {
      setError("Please pick a researcher and a report-by date.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.post(`/admin/reports/${id}/assign`, {
        researcher_id: researcherId,
        budget: budget ? Number(budget) : undefined,
        notes,
        due_date: dueDate,
      });
      setReport(data.report);
      setSuccess("Field inspection assigned successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page">Loading...</div>;
  if (!report) return <div className="page">Report not found.</div>;

  return (
    <div className="page">
      <p>
        <Link to="/admin/reports">← Back to all reports</Link>
      </p>
      <div className="report-header">
        <h1>{report.material}</h1>
        <StatusBadge status={report.status} />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h3>Discovery details</h3>
        <GoogleMapPicker value={report.location} editable={false} height={260} />
        <p className="hint">
          📍 {report.location?.address || `${report.location.lat}, ${report.location.lng}`}
        </p>
        {report.notes && <p>{report.notes}</p>}
        {report.images?.length > 0 && (
          <div className="image-grid">
            {report.images.map((src, i) => (
              <div className="image-thumb" key={i}>
                <img src={src} alt={`report-${i}`} />
              </div>
            ))}
          </div>
        )}
        <h4>Reported by</h4>
        <p>
          {report.reporter?.name} ({report.reporter?.nid})<br />
          ✉️ {report.reporter?.email || report.contact_email} &nbsp; 📞 {report.contact_phone}
        </p>
      </div>

      {report.status === "Pending" ? (
        <div className="card">
          <h3>Assign field inspection</h3>
          <form onSubmit={handleAssign} className="form">
            <label>
              Researcher (nearest listed first)
              <select value={researcherId} onChange={(e) => setResearcherId(e.target.value)} required>
                <option value="">Select a researcher...</option>
                {researchers.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.nid}){r.affiliation ? ` — ${r.affiliation}` : ""}
                    {r.distance_km != null ? ` — ${r.distance_km.toFixed(1)} km away` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Suggested budget (BDT)
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000"
              />
            </label>
            <label>
              Notes for the researcher
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>
            <label>
              Report due by
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </label>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Assigning..." : "Assign Researcher"}
            </button>
          </form>
        </div>
      ) : (
        <div className="card">
          <h3>Assignment</h3>
          <p>
            Assigned to <strong>{report.assignment?.researcher?.name}</strong>
            {report.assignment?.budget ? ` — budget: ৳${report.assignment.budget}` : ""}
          </p>
          {report.assignment?.notes && <p className="hint">{report.assignment.notes}</p>}
          {report.assignment?.due_date && (
            <p className="hint">Due {new Date(report.assignment.due_date).toLocaleDateString()}</p>
          )}
          {report.verification?.result && (
            <div className={`alert ${report.verification.result === "true" ? "alert-success" : "alert-danger"}`}>
              Field verification: {report.verification.result === "true" ? "Confirmed genuine" : "Could not be verified"}
              {report.verification.notes && ` — ${report.verification.notes}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
