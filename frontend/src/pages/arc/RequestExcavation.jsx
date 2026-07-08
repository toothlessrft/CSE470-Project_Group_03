import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function RequestExcavation() {
  const [sites, setSites] = useState([]);
  const [existingSite, setExistingSite] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [era, setEra] = useState("");
  const [description, setDescription] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [proposal, setProposal] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/arc/sites").then((data) => setSites(data.sites));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
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
      setTimeout(() => navigate("/arc/dashboard"), 1200);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <h1>Request Excavation</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
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
          Budget
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required />
        </label>

        <button type="submit" className="btn">
          Submit Request
        </button>
      </form>
    </div>
  );
}
