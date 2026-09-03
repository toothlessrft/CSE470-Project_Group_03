import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
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
      setSuccess("Proposal submitted to the heritage authority for assessment.");
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
          <h3 style={{ margin: 0 }}>{r.site?.name || "Proposed new site"}</h3>
          <StatusBadge status={r.approval_status} />
        </div>
        <p className="meta-row">
          <span>Submitted {new Date(r.createdAt).toLocaleDateString()}</span>
          <span className="num">Budget requested: ৳{Number(r.budget || 0).toLocaleString()}</span>
        </p>
        <p style={{ marginTop: "0.85rem", marginBottom: 0 }}>{r.proposal}</p>
        {r.admin_notes && (
          <div className="alert alert-info" style={{ marginTop: "1rem", marginBottom: 0 }}>
            <span>
              <strong style={{ display: "block", marginBottom: "0.15rem" }}>
                Response from the heritage authority
              </strong>
              {r.admin_notes}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <span className="eyebrow">Licensing</span>
          <h1>Excavation proposals</h1>
          <p className="page-subtitle">
            Apply to excavate a recorded or newly identified site, and follow your applications
            through assessment.
          </p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "New Request" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("New Request")}
        >
          New proposal
        </button>
        <button
          className={`tab ${activeTab === "Pending Requests" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("Pending Requests")}
        >
          Under assessment <span className="tab-count">{pendingRequests.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "Previous Requests" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("Previous Requests")}
        >
          Decided <span className="tab-count">{previousRequests.length}</span>
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {activeTab === "New Request" && (
        <form onSubmit={handleSubmit} className="form">
          <label>
            Recorded site
            <select value={existingSite} onChange={(e) => setExistingSite(e.target.value)}>
              <option value="">Propose a new site instead</option>
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
                <input
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g. Wari-Bateshwar north mound"
                />
              </label>
              <label>
                Period
                <input
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="e.g. Early historic, c. 400 BCE"
                />
              </label>
              <label>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Topography, surface finds, present condition, and threats to the site"
                />
              </label>
              <label>
                Structural evidence
                <textarea
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value)}
                  placeholder="Visible walls, mounds, brickwork, or other built remains"
                />
              </label>
            </fieldset>
          )}

          <label>
            Research proposal
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              rows={5}
              placeholder="Research questions, proposed methodology, duration, and expected outcomes"
              required
            />
          </label>
          <label>
            Budget requested (৳)
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 250000"
              required
            />
          </label>

          <button type="submit" className="btn">
            Submit proposal
          </button>
        </form>
      )}

      {activeTab === "Pending Requests" && (
        <div className="list">
          {loading ? (
            <div className="loading-state">
              <span className="spinner" aria-hidden="true" /> Loading proposals
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="empty-state">
              <Inbox size={24} aria-hidden="true" />
              <h3>Nothing under assessment</h3>
              <p>Proposals awaiting a decision from the heritage authority appear here.</p>
            </div>
          ) : (
            pendingRequests.map(renderRequestCard)
          )}
        </div>
      )}

      {activeTab === "Previous Requests" && (
        <div className="list">
          {loading ? (
            <div className="loading-state">
              <span className="spinner" aria-hidden="true" /> Loading proposals
            </div>
          ) : previousRequests.length === 0 ? (
            <div className="empty-state">
              <Inbox size={24} aria-hidden="true" />
              <h3>No decisions yet</h3>
              <p>Approved and declined proposals are archived here.</p>
            </div>
          ) : (
            previousRequests.map(renderRequestCard)
          )}
        </div>
      )}
    </div>
  );
}
