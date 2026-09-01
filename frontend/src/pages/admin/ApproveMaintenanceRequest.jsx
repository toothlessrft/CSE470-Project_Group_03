import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ApproveMaintenanceRequest() {
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [message, setMessage] = useState("");

  function load() {
    api.get("/admin/maintenance-requests").then((data) => setRequests(data.pending_requests));
  }
  useEffect(load, []);

  async function approve(id) {
    const data = await api.post(`/admin/maintenance-requests/${id}`, {
      action: "approve",
      approved_budget: budgets[id],
    });
    setMessage(data.message);
    load();
  }

  async function deny(id) {
    const data = await api.post(`/admin/maintenance-requests/${id}`, { action: "deny" });
    setMessage(data.message);
    load();
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Site conservation</span>
          <h1>Maintenance requests</h1>
          <p className="page-subtitle">
            Repair work proposed for recorded sites, and the budget authorised against each.
          </p>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Site</th>
            <th>Reported by</th>
            <th>Damage</th>
            <th>Estimated cost</th>
            <th>Budget authorised</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.site?.name}</td>
              <td>{r.caretaker?.name}</td>
              <td>{r.damage}</td>
              <td className="num">৳{Number(r.repair_cost || 0).toLocaleString()}</td>
              <td>
                <input
                  type="number"
                  className="inline-input"
                  placeholder="৳"
                  value={budgets[r._id] || ""}
                  onChange={(e) => setBudgets({ ...budgets, [r._id]: e.target.value })}
                />
              </td>
              <td className="actions">
                <button className="btn-small btn-approve" onClick={() => approve(r._id)}>
                  Approve
                </button>
                <button className="btn-small btn-deny" onClick={() => deny(r._id)}>
                  Decline
                </button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="hint">
                Nothing awaiting a decision.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
