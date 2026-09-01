import { useEffect, useState } from "react";
import { api } from "../../api";

export default function RequestMaintenance() {
  const [siteName, setSiteName] = useState("");
  const [damage, setDamage] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/sc/request_maintenance").then((data) => setSiteName(data.site_name));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/sc/request_maintenance", { damage, repair_cost: repairCost });
      setSuccess("Request submitted to the heritage authority for assessment.");
      setDamage("");
      setRepairCost("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <span className="eyebrow">{siteName || "Site conservation"}</span>
          <h1>Request maintenance</h1>
          <p className="page-subtitle">
            Report damage or deterioration at your assigned site and request a repair budget.
          </p>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Description of the damage
          <textarea
            value={damage}
            onChange={(e) => setDamage(e.target.value)}
            placeholder="What has deteriorated, how far it has progressed, and what is at risk"
            required
          />
        </label>
        <label>
          Estimated repair cost (৳)
          <input
            type="number"
            min="0"
            value={repairCost}
            onChange={(e) => setRepairCost(e.target.value)}
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
