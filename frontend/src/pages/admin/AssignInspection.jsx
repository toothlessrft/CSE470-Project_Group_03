import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FileSignature } from "lucide-react"; // Ahad_23201016
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
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({});

  // Report Approval & Artifact Allocation
  const [researcherReport, setResearcherReport] = useState(null);
  const [rrLoading, setRrLoading] = useState(false);
  const [rrError, setRrError] = useState("");
  const [rrSuccess, setRrSuccess] = useState("");
  const [approving, setApproving] = useState(false);
  // Ahad_23201016 - a tender already published for this field report, if any
  const [tender, setTender] = useState(null);

  useEffect(() => {
    api
      .get(`/admin/reports/${id}`)
      .then((data) => {
        setReport(data.report);
        return api.get(`/admin/researchers?lat=${data.report.location.lat}&lng=${data.report.location.lng}`);
      })
      .then((data) => {
        setResearchers(data.researchers);
        const ids = data.researchers.map((r) => r._id).join(",");
        if (ids) api.get(`/reviews/ratings?ids=${ids}`).then((r) => setRatings(r.ratings));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Once field verification is genuine, load the researcher's final report for review
  useEffect(() => {
    if (report?.verification?.result !== "true") return;
    setRrLoading(true);
    api
      .get(`/admin/researcher-reports/${id}`)
      .then((data) => {
        setResearcherReport(data.report);
        setTender(data.tender || null);
      })
      .catch(() => setResearcherReport(null))
      .finally(() => setRrLoading(false));
  }, [report, id]);

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

  async function handleApproveReport() {
    if (!window.confirm("Approve this field report?")) return;
    setRrError("");
    setRrSuccess("");
    setApproving(true);
    try {
      const data = await api.post(`/admin/researcher-reports/${id}/approve`, {});
      setResearcherReport(data.report);
      setRrSuccess("Field report approved.");
    } catch (err) {
      setRrError(err.message);
    } finally {
      setApproving(false);
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
                {researchers.map((r) => {
                  const rating = ratings[r._id];
                  return (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.nid}){r.affiliation ? ` — ${r.affiliation}` : ""}
                      {r.distance_km != null ? ` — ${r.distance_km.toFixed(1)} km away` : ""}
                      {rating ? ` — ★ ${rating.average}/5 (${rating.count})` : " — No ratings yet"}
                    </option>
                  );
                })}
              </select>
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

      {/* Field report review */}
      {report.verification?.result === "true" && (
        <div className="card" style={{ border: "2px dashed #c98a4b", backgroundColor: "#fdf8f2" }}>
          <h3 style={{ color: "#7c4a2d", marginTop: 0 }}>Researcher Field Report</h3>

          {rrLoading ? (
            <p className="hint">Loading researcher report...</p>
          ) : !researcherReport ? (
            <p className="hint">The researcher hasn&apos;t started their report yet.</p>
          ) : researcherReport.status === "Draft" ? (
            <p className="hint">The researcher is still working on this report as a draft.</p>
          ) : (
            <>
              {rrError && <div className="alert alert-danger">{rrError}</div>}
              {rrSuccess && <div className="alert alert-success">{rrSuccess}</div>}

              <StatusBadge status={researcherReport.status} />

              {researcherReport.requestExcavationTeam && (
                <p style={{ marginTop: "0.75rem" }}>
                  The researcher is requesting that an excavation team be assigned to this site.
                </p>
              )}
              {researcherReport.budgetRequested != null && (
                <p>Requested budget: ৳{researcherReport.budgetRequested}</p>
              )}

              {/* Field inspection notes written by the archaeologist */}
              <h4>Field inspection notes</h4>
              <p
                style={{
                  margin: "0 0 1rem",
                  padding: "0.75rem 1rem",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderLeft: "4px solid var(--accent)",
                  borderRadius: "6px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {researcherReport.notes || report.verification?.notes || "The researcher did not leave any notes."}
              </p>

              {researcherReport.status === "Pending" && (
                <button className="btn btn-approve" onClick={handleApproveReport} disabled={approving}>
                  {approving ? "Approving..." : "Approve Field Report"}
                </button>
              )}

              {/* Ahad_23201016 - Tender Publication.
                  Once the field report is approved and the archaeologist asked
                  for an excavation team, the Government opens it up to bidding. */}
              {researcherReport.status === "Approved" && researcherReport.requestExcavationTeam && (
                <div
                  className="card"
                  style={{ margin: "1rem 0 0", background: "var(--surface)", borderLeft: "4px solid var(--accent)" }}
                >
                  {tender ? (
                    <>
                      {/* Ahad_23201016 - the tender for this report already exists, so
                          show where it stands instead of offering to publish it again. */}
                      <h4 style={{ marginTop: 0 }}>Excavation Tender Published</h4>
                      <p className="hint" style={{ marginTop: 0 }}>
                        &ldquo;{tender.title}&rdquo; &mdash; <StatusBadge status={tender.status} />
                        {tender.deadline && ` Bidding closes ${new Date(tender.deadline).toLocaleDateString()}.`}
                      </p>
                      <Link
                        className="btn"
                        to={`/admin/tenders/${tender._id}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <FileSignature size={15} /> View Tender
                      </Link>
                    </>
                  ) : (
                    <>
                      <h4 style={{ marginTop: 0 }}>Excavation Team Requested</h4>
                      <p className="hint" style={{ marginTop: 0 }}>
                        Publish an excavation tender so registered excavation teams can bid on this dig.
                        Project details and the map location are carried over from this report automatically.
                      </p>
                      <Link
                        className="btn"
                        to={`/admin/tenders/new?report=${researcherReport._id}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <FileSignature size={15} /> Publish Excavation Tender
                      </Link>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
