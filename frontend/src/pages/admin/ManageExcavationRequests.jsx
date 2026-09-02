import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function ManageExcavationRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get("/admin/excavation-requests").then((data) => setRequests(data.requests));
  }, []);

  return (
    <div className="page">
      <h1>Manage Excavation Requests</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Archaeologist</th>
            <th>Site</th>
            <th>Proposal</th>
            <th>Budget</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.archaeologist?.name}</td>
              <td>{r.site?.name}</td>
              <td>{r.proposal}</td>
              <td>{r.budget}</td>
              <td>
                <Link to={`/admin/excavation-requests/${r._id}`}>Review</Link>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5}>No excavation requests.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
