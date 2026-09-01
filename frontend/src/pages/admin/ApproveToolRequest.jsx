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
      <div className="page-head">
        <div>
          <span className="eyebrow">Field logistics</span>
          <h1>Equipment requests</h1>
          <p className="page-subtitle">
            Applications to draw tools and instruments from the national equipment pool.
          </p>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Requested by</th>
            <th>Equipment</th>
            <th>Intended use</th>
            <th>Period</th>
            <th>Decision</th>
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
                  Decline
                </button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="hint">
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
