import { useEffect, useState } from "react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

export default function RequestExcavation() {
  const [activeTab, setActiveTab] = useState("New Request");
  const [sites, setSites] = useState([]);
  const [requests, setRequests] = useState([]);

  // Form State
  const [existingSite, setExistingSite] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [era, setEra] = useState("");
  const [description, setDescription] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [proposal, setProposal] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    Promise.all([
      api.get("/arc/sites"),
      api.get("/arc/request_excavation"),
    ])
      .then(([sitesData, reqData]) => {
        setSites(sitesData.sites);
        setRequests(reqData.requests);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/arc/request_excavation", {
        existing_site: existingSite || undefined,
        new_site_name: existingSite ? undefined : newSiteName,
        era,
        description,
        architecture,
        proposal,
        budget,
      });
      setSuccess("Excavation request submitted!");
      setExistingSite("");
      setNewSiteName("");
      setEra("");
      setDescription("");
      setArchitecture("");
      setProposal("");
      setBudget("");
      loadData(); // Reload to show the new request
    } catch (err) {
      setError(err.message);
    }
  }

  const pendingRequests = requests.filter((r) => r.approval_status === "Pending");
  const previousRequests = requests.filter((r) => r.approval_status !== "Pending");

  function renderRequestCard(r) {
    return (
      <div className="card" key={r._id}>
        <div className="report-header">
          <strong>{r.site?.name || "New Site Proposal"}</strong>
          <StatusBadge status={r.approval_status} />
        </div>
        <p className="hint">Submitted on {new Date(r.createdAt).toLocaleDateString()}</p>
        <p><strong>Proposal:</strong> {r.proposal}</p>
        <p><strong>Requested Budget:</strong> ৳{r.budget}</p>
        {r.admin_notes && <p className="hint"><strong>Admin Notes:</strong> {r.admin_notes}</p>}
      </div>
    );
  }

  return (
    <div className="page narrow">
      <h1>Excavation Requests</h1>
      <p className="page-subtitle">Submit proposals for new site excavations or track existing ones.</p>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "New Request" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("New Request")}
        >
          New Request
        </button>
        <button
          className={`tab ${activeTab === "Pending Requests" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("Pending Requests")}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          className={`tab ${activeTab === "Previous Requests" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("Previous Requests")}
        >
          Previous
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {activeTab === "New Request" && (
        <form onSubmit={handleSubmit} className="form">
          <label>
            Existing site
            <select value={existingSite} onChange={(e) => setExistingSite(e.target.value)}>
              <option value="">-- Propose a new site instead --</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {!existingSite && (
            <fieldset>
              <legend>New site details</legend>
              <label>
                Site name
                <input value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} />
              </label>
              <label>
                Era
                <input value={era} onChange={(e) => setEra(e.target.value)} />
              </label>
              <label>
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label>
                Architecture
                <textarea value={architecture} onChange={(e) => setArchitecture(e.target.value)} />
              </label>
            </fieldset>
          )}

          <label>
            Proposal
            <textarea value={proposal} onChange={(e) => setProposal(e.target.value)} required />
          </label>
          <label>
            Budget Suggested
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required />
          </label>

          <button type="submit" className="btn">
            Submit Request
          </button>
        </form>
      )}

      {activeTab === "Pending Requests" && (
        <div className="list">
          {loading ? <p>Loading...</p> : pendingRequests.length === 0 ? <p className="hint">No pending requests.</p> : pendingRequests.map(renderRequestCard)}
        </div>
      )}

      {activeTab === "Previous Requests" && (
        <div className="list">
          {loading ? <p>Loading...</p> : previousRequests.length === 0 ? <p className="hint">No previous requests.</p> : previousRequests.map(renderRequestCard)}
        </div>
      )}
    </div>
  );
}
