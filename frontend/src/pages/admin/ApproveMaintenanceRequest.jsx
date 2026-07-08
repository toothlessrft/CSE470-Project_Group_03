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
      <h1>Approve Maintenance Requests</h1>
      {message && <div className="alert alert-success">{message}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Site</th>
            <th>Caretaker</th>
            <th>Damage</th>
            <th>Repair Cost</th>
            <th>Approved Budget</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.site?.name}</td>
              <td>{r.caretaker?.name}</td>
              <td>{r.damage}</td>
              <td>{r.repair_cost}</td>
              <td>
                <input
                  type="number"
                  className="inline-input"
                  placeholder="amount"
                  value={budgets[r._id] || ""}
                  onChange={(e) => setBudgets({ ...budgets, [r._id]: e.target.value })}
                />
              </td>
              <td className="actions">
                <button className="btn-small btn-approve" onClick={() => approve(r._id)}>
                  Approve
                </button>
                <button className="btn-small btn-deny" onClick={() => deny(r._id)}>
                  Deny
                </button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6}>No pending requests.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
