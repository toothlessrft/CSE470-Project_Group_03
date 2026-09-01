import { useEffect, useState } from "react";
import { api } from "../../api";

export default function RequestItems() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/mm/sites").then((data) => setSites(data.sites));
  }, []);

  useEffect(() => {
    if (siteId) {
      api.get(`/mm/sites/${siteId}/items`).then((data) => setItems(data.items));
    } else {
      setItems([]);
    }
  }, [siteId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/mm/request_items", {
        item_id: itemId,
        purpose,
        start_date: startDate,
        end_date: endDate,
        insurance_info: insuranceInfo,
      });
      setSuccess("Request submitted to the heritage authority for assessment.");
      setPurpose("");
      setStartDate("");
      setEndDate("");
      setInsuranceInfo("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <span className="eyebrow">Acquisition</span>
          <h1>Request an artifact</h1>
          <p className="page-subtitle">
            Apply to the heritage authority to hold a catalogued artifact for exhibition at your
            museum.
          </p>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Excavation site
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
            <option value="">Choose a site</option>
            {sites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.era})
              </option>
            ))}
          </select>
        </label>

        {siteId && (
          <label>
            Artifact
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} required>
              <option value="">Choose an artifact</option>
              {items.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} ({i.Type})
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Purpose of the request
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="The exhibition or programme the artifact is required for, and its intended display context"
            required
          />
        </label>
        <div className="form-row">
          <label>
            Required from
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            Return by
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
        </div>
        <label>
          Insurance and security arrangements
          <textarea
            value={insuranceInfo}
            onChange={(e) => setInsuranceInfo(e.target.value)}
            placeholder="Cover in place, transport arrangements, and environmental controls at the display location"
            required
          />
        </label>
        <button type="submit" className="btn">
          Submit request
        </button>
      </form>
    </div>
  );
}
