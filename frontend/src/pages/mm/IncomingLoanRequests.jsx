import { useEffect, useState } from "react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

function daysRemaining(end) {
  if (!end) return null;
  const ms = new Date(end) - new Date();
  return Math.ceil(ms / 86400000);
}

export default function IncomingLoanRequests() {
  const [loans, setLoans] = useState([]);
  const [message, setMessage] = useState("");

  function load() {
    api.get("/loans/incoming").then((data) => setLoans(data.loans));
  }
  useEffect(load, []);

  async function decide(id, action) {
    const data = await api.post(`/loans/${id}/decision`, { action });
    setMessage(data.message);
    load();
  }

  async function markReturned(id) {
    const data = await api.post(`/loans/${id}/return`, {});
    setMessage(data.message);
    load();
  }

  const pending = loans.filter((l) => l.status === "Pending");
  const active = loans.filter((l) => l.status === "Approved");
  const decided = loans.filter((l) => l.status === "Declined" || l.status === "Returned");

  return (
    <div className="page">
      <h1>Incoming Loan Requests</h1>
      <p className="page-subtitle">Requests from other museums to borrow artifacts your museum holds.</p>
      {message && <div className="alert alert-success">{message}</div>}

      <h3>Pending approval</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Requesting Museum</th>
            <th>Artifact</th>
            <th>Exhibition</th>
            <th>Purpose</th>
            <th>Requested Loan Period</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((l) => (
            <tr key={l._id}>
              <td>{l.requesting_museum?.roleProfile?.museum_name || l.requesting_museum?.name}</td>
              <td>
                {l.item?.name} ({l.item?.Type})
              </td>
              <td>{l.exhibition_name}</td>
              <td>{l.purpose}</td>
              <td>
                {l.start_date?.slice(0, 10)} - {l.end_date?.slice(0, 10)}
              </td>
              <td className="actions">
                <button className="btn-small btn-approve" onClick={() => decide(l._id, "approve")}>
                  Approve
                </button>
                <button className="btn-small btn-deny" onClick={() => decide(l._id, "decline")}>
                  Decline
                </button>
              </td>
            </tr>
          ))}
          {pending.length === 0 && (
            <tr>
              <td colSpan={6}>No pending requests.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>Active loans (out on loan)</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Requesting Museum</th>
            <th>Artifact</th>
            <th>Loan Period</th>
            <th>Time Left</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {active.map((l) => {
            const remaining = daysRemaining(l.end_date);
            return (
              <tr key={l._id}>
                <td>{l.requesting_museum?.roleProfile?.museum_name || l.requesting_museum?.name}</td>
                <td>
                  {l.item?.name} ({l.item?.Type})
                </td>
                <td>
                  {l.start_date?.slice(0, 10)} - {l.end_date?.slice(0, 10)}
                </td>
                <td>{remaining >= 0 ? `${remaining} days left` : `${Math.abs(remaining)} days overdue`}</td>
                <td className="actions">
                  <button className="btn-small btn-approve" onClick={() => markReturned(l._id)}>
                    Mark Returned
                  </button>
                </td>
              </tr>
            );
          })}
          {active.length === 0 && (
            <tr>
              <td colSpan={5}>No active loans.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>History</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Requesting Museum</th>
            <th>Artifact</th>
            <th>Loan Period</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {decided.map((l) => (
            <tr key={l._id}>
              <td>{l.requesting_museum?.roleProfile?.museum_name || l.requesting_museum?.name}</td>
              <td>
                {l.item?.name} ({l.item?.Type})
              </td>
              <td>
                {l.start_date?.slice(0, 10)} - {l.end_date?.slice(0, 10)}
              </td>
              <td>
                <StatusBadge status={l.status} />
              </td>
            </tr>
          ))}
          {decided.length === 0 && (
            <tr>
              <td colSpan={4}>Nothing here yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
