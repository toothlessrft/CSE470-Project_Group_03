import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ApproveToolRequest() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  function load() {
    api.get("/admin/tool-requests").then((data) => setRequests(data.pending_requests));
  }
  useEffect(load, []);

  async function act(id, action) {
    const data = await api.post(`/admin/tool-requests/${id}`, { action });
    setMessage(data.message);
    load();
  }

  return (
    <div className="page">
      <h1>Approve Tool Requests</h1>
      {message && <div className="alert alert-success">{message}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Requester</th>
            <th>Tool</th>
            <th>Purpose</th>
            <th>Dates</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.user?.name}</td>
              <td>{r.tool?.model_no} ({r.tool?.type})</td>
              <td>{r.purpose}</td>
              <td>
                {r.start_date?.slice(0, 10)} - {r.end_date?.slice(0, 10)}
              </td>
              <td className="actions">
                <button className="btn-small btn-approve" onClick={() => act(r._id, "approve")}>
                  Approve
                </button>
                <button className="btn-small btn-deny" onClick={() => act(r._id, "deny")}>
                  Deny
                </button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5}>No pending requests.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
