import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ApproveItemRequest() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  function load() {
    api.get("/admin/item-requests").then((data) => setRequests(data.pending_requests));
  }
  useEffect(load, []);

  async function act(id, action) {
    const data = await api.post(`/admin/item-requests/${id}`, { action });
    setMessage(data.message);
    load();
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Museum acquisitions</span>
          <h1>Artifact requests</h1>
          <p className="page-subtitle">
            Applications from museums to hold a catalogued artifact for exhibition.
          </p>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Artifact</th>
            <th>Purpose</th>
            <th>Requested period</th>
            <th>Insurance</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.museum_manager?.name}</td>
              <td>{r.item?.name}</td>
              <td>{r.purpose}</td>
              <td>
                {r.start_date?.slice(0, 10)} - {r.end_date?.slice(0, 10)}
              </td>
              <td>{r.insurance_info}</td>
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
