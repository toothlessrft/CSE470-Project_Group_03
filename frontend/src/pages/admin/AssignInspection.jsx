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

  // Report Approval & Artifact Allocation
  const [researcherReport, setResearcherReport] = useState(null);
  const [rrLoading, setRrLoading] = useState(false);
  const [rrError, setRrError] = useState("");
  const [rrSuccess, setRrSuccess] = useState("");
  const [approving, setApproving] = useState(false);
  const [allocationForms, setAllocationForms] = useState({}); // itemId -> { destination, museumName }
  const [allocatingId, setAllocatingId] = useState(null);

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

  // Once field verification is genuine, load the researcher's final report for review
  useEffect(() => {
    if (report?.verification?.result !== "true") return;
    setRrLoading(true);
    api
      .get(`/admin/researcher-reports/${id}`)
      .then((data) => setResearcherReport(data.report))
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

  async function handleApproveReport() {
    if (!window.confirm("Approve this final report? Its artifacts will be added to Smart Artifact Search.")) return;
    setRrError("");
    setRrSuccess("");
    setApproving(true);
    try {
      const data = await api.post(`/admin/researcher-reports/${id}/approve`, {});
      setResearcherReport(data.report);
      setRrSuccess("Report approved. Artifacts added to the catalogue as Unallocated.");
    } catch (err) {
      setRrError(err.message);
    } finally {
      setApproving(false);
    }
  }

  function updateAllocationForm(itemId, patch) {
    setAllocationForms((prev) => ({
      ...prev,
      [itemId]: { destination: "Museum", museumName: "", ...prev[itemId], ...patch },
    }));
  }

  async function handleAllocate(itemId) {
    const form = allocationForms[itemId] || { destination: "Museum", museumName: "" };
    setRrError("");
    setRrSuccess("");
    setAllocatingId(itemId);
    try {
      const data = await api.post(`/admin/artifacts/${itemId}/allocate`, {
        destination: form.destination,
        museumName: form.museumName,
      });
      setResearcherReport((prev) => ({
        ...prev,
        allocatedItems: prev.allocatedItems.map((it) => (it._id === itemId ? data.item : it)),
      }));
      setRrSuccess(`${data.item.name} allocated to ${form.destination === "Museum" ? form.museumName : "Auction"}.`);
    } catch (err) {
      setRrError(err.message);
    } finally {
      setAllocatingId(null);
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

      {/* Report Approval & Artifact Allocation */}
      {report.verification?.result === "true" && (
        <div className="card" style={{ border: "2px dashed #c98a4b", backgroundColor: "#fdf8f2" }}>
          <h3 style={{ color: "#7c4a2d", marginTop: 0 }}>Researcher Final Report</h3>

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

              <p style={{ marginTop: "0.75rem" }}>
                {researcherReport.possibleArtifact ? "Researcher flagged a possible artifact at this site." : "Researcher did not flag a possible artifact."}
              </p>
              {researcherReport.requestExcavationTeam && <p>🛠️ Requesting an excavation team (engineers) be assigned.</p>}
              {researcherReport.budgetRequested != null && (
                <p>Requested budget: ৳{researcherReport.budgetRequested}</p>
              )}
              {researcherReport.notes && <p>{researcherReport.notes}</p>}

              <h4>Artifacts Found</h4>
              {researcherReport.artifacts?.length === 0 ? (
                <p className="hint">No artifacts were listed on this report.</p>
              ) : researcherReport.status === "Pending" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                  {researcherReport.artifacts.map((a, i) => (
                    <div key={i} className="card" style={{ margin: 0, padding: "0.85rem 1rem" }}>
                      <strong>{a.name}</strong>
                      <p className="hint" style={{ margin: "0.2rem 0" }}>{a.Type}</p>
                      {a.description && <p style={{ fontSize: "0.85rem" }}>{a.description}</p>}
                      <p style={{ fontSize: "0.8rem", color: "#777", margin: 0 }}>
                        {a.civilization && <>Civilization: {a.civilization}<br /></>}
                        {a.era && <>Era: {a.era}<br /></>}
                        {a.region && <>Region: {a.region}<br /></>}
                        {a.material && <>Material: {a.material}<br /></>}
                        {a.usage && <>Usage: {a.usage}</>}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                  {researcherReport.allocatedItems?.map((item) => {
                    const form = allocationForms[item._id] || { destination: "Museum", museumName: item.museumName || "" };
                    const isAllocated = item.allocation !== "Unallocated";
                    return (
                      <div key={item._id} className="card" style={{ margin: 0, padding: "0.85rem 1rem" }}>
                        <strong>{item.name}</strong>
                        <p className="hint" style={{ margin: "0.2rem 0" }}>{item.Type}</p>

                        {isAllocated ? (
                          <div className="alert alert-success" style={{ margin: "0.5rem 0 0" }}>
                            ✅ {item.allocation === "Museum"
                              ? `Allocated to museum storage — ${item.museumName}`
                              : "Allocated for auction"}
                          </div>
                        ) : (
                          <>
                            <p style={{ fontSize: "0.85rem" }}>
                              Allocation: <strong>Unallocated</strong>
                            </p>
                            <div className="form">
                              <label>
                                Send to
                                <select
                                  value={form.destination}
                                  onChange={(e) => updateAllocationForm(item._id, { destination: e.target.value })}
                                >
                                  <option value="Museum">Museum Storage</option>
                                  <option value="Auction">Auction</option>
                                </select>
                              </label>
                              {form.destination === "Museum" && (
                                <label>
                                  Museum name
                                  <input
                                    value={form.museumName}
                                    onChange={(e) => updateAllocationForm(item._id, { museumName: e.target.value })}
                                    placeholder="e.g. National Museum of Bangladesh"
                                  />
                                </label>
                              )}
                              <button
                                type="button"
                                className="btn-small"
                                disabled={allocatingId === item._id}
                                onClick={() => handleAllocate(item._id)}
                              >
                                {allocatingId === item._id ? "Saving..." : "Save Allocation"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {researcherReport.status === "Pending" && (
                <button className="btn btn-approve" onClick={handleApproveReport} disabled={approving}>
                  {approving ? "Approving..." : "Approve Final Report"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
