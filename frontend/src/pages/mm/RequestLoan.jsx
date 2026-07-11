import { useEffect, useState } from "react";
import { api } from "../../api";

export default function RequestLoan() {
  const [museums, setMuseums] = useState([]);
  const [items, setItems] = useState([]);

  const [lendingMuseumId, setLendingMuseumId] = useState("");
  const [itemId, setItemId] = useState("");
  const [exhibitionName, setExhibitionName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/loans/museums").then((data) => setMuseums(data.museums));
    api.get("/loans/items").then((data) => setItems(data.items));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/loans/request", {
        lending_museum_id: lendingMuseumId,
        item_id: itemId,
        exhibition_name: exhibitionName,
        purpose,
        start_date: startDate,
        end_date: endDate,
      });
      setSuccess("Loan request sent successfully!");
      setLendingMuseumId("");
      setItemId("");
      setExhibitionName("");
      setPurpose("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <h1>Request Artifact Loan</h1>
      <p className="page-subtitle">Ask another museum authority to loan an artifact for your exhibition.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Lend from (museum)
          <select value={lendingMuseumId} onChange={(e) => setLendingMuseumId(e.target.value)} required>
            <option value="">-- choose a museum --</option>
            {museums.map((m) => (
              <option key={m._id} value={m._id}>
                {m.roleProfile?.museum_name || m.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Artifact
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} required>
            <option value="">-- choose an artifact --</option>
            {items.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name} ({i.Type}){i.site?.name ? ` - ${i.site.name}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Exhibition name
          <input
            type="text"
            value={exhibitionName}
            onChange={(e) => setExhibitionName(e.target.value)}
            placeholder="e.g. Bronze Age Treasures"
            required
          />
        </label>

        <label>
          Purpose
          <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        </label>

        <label>
          Loan start date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label>
          Loan end date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>

        <button type="submit" className="btn">
          Send Loan Request
        </button>
      </form>
    </div>
  );
}
