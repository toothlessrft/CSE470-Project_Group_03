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
      <div className="page-head">
        <div>
          <span className="eyebrow">Inter-museum loans</span>
          <h1>Incoming loan requests</h1>
          <p className="page-subtitle">
            Requests from other museums to borrow artifacts from your collection.
          </p>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}

      <div className="section-head">
        <h2>Awaiting your decision</h2>
        <span className="hint">{pending.length} outstanding</span>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Requesting museum</th>
            <th>Artifact</th>
            <th>Exhibition</th>
            <th>Purpose</th>
            <th>Requested period</th>
            <th>Decision</th>
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
              <td colSpan={6} className="hint">
                Nothing awaiting a decision.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <div className="section-head">
        <h2>Currently out on loan</h2>
        <span className="hint">{active.length} in circulation</span>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Borrowing museum</th>
            <th>Artifact</th>
            <th>Loan period</th>
            <th>Time remaining</th>
            <th>Action</th>
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
                    Record return
                  </button>
                </td>
              </tr>
            );
          })}
          {active.length === 0 && (
            <tr>
              <td colSpan={5} className="hint">
                Nothing is currently out on loan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <div className="section-head">
        <h2>Closed requests</h2>
        <span className="hint">Declined and returned</span>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Requesting museum</th>
            <th>Artifact</th>
            <th>Loan period</th>
            <th>Outcome</th>
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
              <td colSpan={4} className="hint">
                No closed requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
