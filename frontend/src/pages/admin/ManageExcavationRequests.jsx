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
      <div className="page-head">
        <div>
          <span className="eyebrow">Licensing</span>
          <h1>Excavation proposals</h1>
          <p className="page-subtitle">
            Research proposals from archaeologists seeking a licence to excavate.
          </p>
        </div>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Site</th>
            <th>Proposal</th>
            <th>Budget requested</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.archaeologist?.name}</td>
              <td>{r.site?.name}</td>
              <td>{r.proposal}</td>
              <td className="num">৳{Number(r.budget || 0).toLocaleString()}</td>
              <td>
                <Link className="btn-small btn-secondary" to={`/admin/excavation-requests/${r._id}`}>
                  Assess
                </Link>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="hint">
                No proposals awaiting assessment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
