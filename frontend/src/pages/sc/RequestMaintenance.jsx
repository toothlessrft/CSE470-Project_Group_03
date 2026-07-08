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
      setSuccess("Maintenance request submitted successfully!");
      setDamage("");
      setRepairCost("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <h1>Request Maintenance {siteName && `- ${siteName}`}</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Damage description
          <textarea value={damage} onChange={(e) => setDamage(e.target.value)} required />
        </label>
        <label>
          Estimated repair cost
          <input type="number" value={repairCost} onChange={(e) => setRepairCost(e.target.value)} required />
        </label>
        <button type="submit" className="btn">
          Submit Request
        </button>
      </form>
    </div>
  );
}
