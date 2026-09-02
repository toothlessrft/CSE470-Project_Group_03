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
      setSuccess("Item request submitted successfully!");
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
      <h1>Request Items</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Site
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
            <option value="">-- choose a site --</option>
            {sites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.era})
              </option>
            ))}
          </select>
        </label>

        {siteId && (
          <label>
            Item
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} required>
              <option value="">-- choose an item --</option>
              {items.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} ({i.Type})
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Purpose
          <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        </label>
        <label>
          Start date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label>
          End date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>
        <label>
          Insurance info
          <textarea value={insuranceInfo} onChange={(e) => setInsuranceInfo(e.target.value)} required />
        </label>
        <button type="submit" className="btn">
          Submit Request
        </button>
      </form>
    </div>
  );
}
