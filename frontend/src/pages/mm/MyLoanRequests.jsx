import { useEffect, useState } from "react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

function durationDays(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / 86400000));
}

function daysRemaining(end) {
  if (!end) return null;
  const ms = new Date(end) - new Date();
  return Math.ceil(ms / 86400000);
}

export default function MyLoanRequests() {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    api.get("/loans/outgoing").then((data) => setLoans(data.loans));
  }, []);

  return (
    <div className="page">
      <h1>My Loan Requests</h1>
      <p className="page-subtitle">Artifact loans you've requested from other museums.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Lending Museum</th>
            <th>Artifact</th>
            <th>Exhibition</th>
            <th>Loan Period</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => {
            const remaining = l.status === "Approved" ? daysRemaining(l.end_date) : null;
            return (
              <tr key={l._id}>
                <td>{l.lending_museum?.roleProfile?.museum_name || l.lending_museum?.name}</td>
                <td>
                  {l.item?.name} ({l.item?.Type})
                </td>
                <td>{l.exhibition_name}</td>
                <td>
                  {l.start_date?.slice(0, 10)} - {l.end_date?.slice(0, 10)}
                </td>
                <td>
                  {durationDays(l.start_date, l.end_date)} days
                  {remaining != null && (
                    <div className="page-subtitle" style={{ margin: 0 }}>
                      {remaining >= 0 ? `${remaining} days left` : `${Math.abs(remaining)} days overdue`}
                    </div>
                  )}
                </td>
                <td>
                  <StatusBadge status={l.status} />
                </td>
              </tr>
            );
          })}
          {loans.length === 0 && (
            <tr>
              <td colSpan={6}>No loan requests yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
