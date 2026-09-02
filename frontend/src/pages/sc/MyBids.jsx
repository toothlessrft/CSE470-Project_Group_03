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
      <h1>My Bids</h1>
      <p className="page-subtitle">Track the status of every tender you've bid on.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : bids.length === 0 ? (
        <div className="card">
          You haven&apos;t submitted any bids yet. <Link to="/sc/tenders">Browse open tenders</Link>.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Tender</th>
              <th>Location</th>
              <th>Your Cost</th>
              <th>Timeline</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b) => (
              <tr key={b._id}>
                <td>{b.tender?.title || "Tender removed"}</td>
                <td>{b.tender?.location}</td>
                <td>৳{b.cost}</td>
                <td>{b.timeline}</td>
                <td>{b.tender?.deadline ? new Date(b.tender.deadline).toLocaleDateString() : "—"}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
