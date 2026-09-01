// Tender Bidding System (Excavation Team): Ahad_23201016
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/sc/my-bids")
      .then((data) => setBids(data.bids))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Procurement</span>
          <h1>Submitted bids</h1>
          <p className="page-subtitle">Every tender you have bid on, and where each bid stands.</p>
        </div>
        <Link className="btn btn-secondary" to="/sc/tenders">
          Browse open tenders
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your bids
        </div>
      ) : bids.length === 0 ? (
        <div className="empty-state">
          <h3>No bids lodged</h3>
          <p>Bids you submit against published tenders are tracked here.</p>
          <Link className="btn" to="/sc/tenders">
            Browse open tenders
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tender</th>
              <th>Location</th>
              <th>Your price</th>
              <th>Programme</th>
              <th>Closes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b) => (
              <tr key={b._id}>
                <td>{b.tender?.title || "Tender withdrawn"}</td>
                <td>{b.tender?.location}</td>
                <td className="num">৳{Number(b.cost || 0).toLocaleString()}</td>
                <td>{b.timeline}</td>
                <td>{b.tender?.deadline ? new Date(b.tender.deadline).toLocaleDateString() : "—"}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
