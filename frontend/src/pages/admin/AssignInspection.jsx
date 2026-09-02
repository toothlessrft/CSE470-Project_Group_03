import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FileSignature, ArrowLeft, MapPin } from "lucide-react"; // Ahad_23201016
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import SearchableSelect from "../../components/SearchableSelect";
import StatusBadge from "../../components/StatusBadge";
import { MUSEUMS } from "../../data/museums";

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

  if (loading)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the report
        </div>
      </div>
    );
  if (!report)
    return (
      <div className="page">
        <div className="alert alert-danger">This report could not be found.</div>
      </div>
    );

  return (
    <div className="page">
      <Link className="back-link" to="/admin/reports">
        <ArrowLeft size={14} aria-hidden="true" /> Back to field reports
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Discovery report</span>
          <h1>{report.material}</h1>
        </div>
        <StatusBadge status={report.status} />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="panel">
        <div className="panel-head">
          <h3>Reported find</h3>
        </div>
        <div className="panel-body">
          <GoogleMapPicker value={report.location} editable={false} height={260} />
          <p className="meta-row">
            <span>
              <MapPin size={13} aria-hidden="true" />
              {report.location?.address || `${report.location.lat}, ${report.location.lng}`}
            </span>
          </p>

          {report.notes && <p style={{ marginTop: "0.85rem" }}>{report.notes}</p>}

          {report.images?.length > 0 && (
            <div className="image-grid">
              {report.images.map((src, i) => (
                <div className="image-thumb" key={i}>
                  <img src={src} alt={`Photograph ${i + 1} of the reported find`} />
                </div>
              ))}
            </div>
          )}

          <h4 className="section-title">Reported by</h4>
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>
                {report.reporter?.name} ({report.reporter?.nid})
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{report.reporter?.email || report.contact_email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{report.contact_phone}</dd>
            </div>
          </dl>
        </div>
      </div>

      {report.status === "Pending" ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Assign a field inspection</h3>
          </div>
          <div className="panel-body">
          <form onSubmit={handleAssign} className="form">
            <label>
              Inspecting archaeologist
              <select value={researcherId} onChange={(e) => setResearcherId(e.target.value)} required>
                <option value="">Choose an archaeologist</option>
                {researchers.map((r) => {
                  const rating = ratings[r._id];
                  return (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.nid}){r.affiliation ? ` — ${r.affiliation}` : ""}
                      {r.distance_km != null ? ` — ${r.distance_km.toFixed(1)} km away` : ""}
                      {rating ? ` — rated ${rating.average}/5 from ${rating.count}` : " — not yet rated"}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              Instructions for the inspector
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What to look for on site, and anything the reporter should be asked"
              />
            </label>
            <label>
              Field report due by
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </label>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Assigning" : "Assign inspection"}
            </button>
          </form>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <h3>Assignment</h3>
          </div>
          <div className="panel-body">
            <dl className="detail-list">
              <div>
                <dt>Assigned to</dt>
                <dd>{report.assignment?.researcher?.name}</dd>
              </div>
              {report.assignment?.budget && (
                <div>
                  <dt>Budget</dt>
                  <dd className="num">৳{Number(report.assignment.budget).toLocaleString()}</dd>
                </div>
              )}
              {report.assignment?.due_date && (
                <div>
                  <dt>Report due</dt>
                  <dd className="num">
                    {new Date(report.assignment.due_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
            {report.assignment?.notes && (
              <p className="subtle" style={{ marginTop: "1rem" }}>
                {report.assignment.notes}
              </p>
            )}
            {report.verification?.result && (
              <div
                className={`alert ${
                  report.verification.result === "true" ? "alert-success" : "alert-danger"
                }`}
                style={{ marginTop: "1rem", marginBottom: 0 }}
              >
                <span>
                  Field verification:{" "}
                  {report.verification.result === "true"
                    ? "confirmed as genuine"
                    : "could not be verified"}
                  {report.verification.notes && ` — ${report.verification.notes}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Field report review */}
      {report.verification?.result === "true" && (
        <div className="panel">
          <div className="panel-head">
            <h3>Field report</h3>
            {researcherReport?.status && <StatusBadge status={researcherReport.status} />}
          </div>
          <div className="panel-body">

          {rrLoading ? (
            <p className="loading-state" style={{ padding: 0 }}>
              <span className="spinner" aria-hidden="true" /> Loading the field report
            </p>
          ) : !researcherReport ? (
            <p className="hint" style={{ margin: 0 }}>
              The inspecting archaeologist has not started their report yet.
            </p>
          ) : researcherReport.status === "Draft" ? (
            <p className="hint" style={{ margin: 0 }}>
              The report is still an unsubmitted draft.
            </p>
          ) : (
            <>
              {rrError && <div className="alert alert-danger">{rrError}</div>}
              {rrSuccess && <div className="alert alert-success">{rrSuccess}</div>}

              <dl className="detail-list" style={{ marginBottom: "1rem" }}>
                <div>
                  <dt>Excavation recommended</dt>
                  <dd>{researcherReport.requestExcavationTeam ? "Yes" : "No"}</dd>
                </div>
                {researcherReport.budgetRequested != null && (
                  <div>
                    <dt>Budget requested</dt>
                    <dd className="num">
                      ৳{Number(researcherReport.budgetRequested).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Findings written by the inspecting archaeologist */}
              <span className="stat-label">Findings</span>
              <p className="subtle" style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0 1rem" }}>
                {researcherReport.notes ||
                  report.verification?.notes ||
                  "No findings were recorded on this report."}
              </p>

              {researcherReport.status === "Pending" && (
                <button className="btn btn-approve" onClick={handleApproveReport} disabled={approving}>
                  {approving ? "Approving" : "Approve field report"}
                </button>
              )}

              {/* Ahad_23201016 - Tender Publication.
                  Once the field report is approved and the archaeologist asked
                  for an excavation team, the Government opens it up to bidding. */}
              {researcherReport.status === "Approved" && researcherReport.requestExcavationTeam && (
                <div className="subtle" style={{ marginTop: "1.25rem", borderLeft: "3px solid var(--accent)" }}>
                  {tender ? (
                    <>
                      {/* Ahad_23201016 - the tender for this report already exists, so
                          show where it stands instead of offering to publish it again. */}
                      <h4 style={{ marginTop: 0 }}>Tender published</h4>
                      <p className="hint" style={{ marginTop: 0 }}>
                        {tender.title}
                        {tender.deadline &&
                          ` — bidding closes ${new Date(tender.deadline).toLocaleDateString()}.`}
                      </p>
                      <Link className="btn btn-small" to={`/admin/tenders/${tender._id}`}>
                        <FileSignature size={13} aria-hidden="true" /> Open tender
                      </Link>
                    </>
                  ) : (
                    <>
                      <h4 style={{ marginTop: 0 }}>Excavation recommended</h4>
                      <p className="hint" style={{ marginTop: 0 }}>
                        Publish a tender so licensed contractors can bid on this excavation. The
                        project details and map location carry over from this report automatically.
                      </p>
                      <Link className="btn btn-small" to={`/admin/tenders/new?report=${researcherReport._id}`}>
                        <FileSignature size={13} aria-hidden="true" /> Publish tender
                      </Link>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
