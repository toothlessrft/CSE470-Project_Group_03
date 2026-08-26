import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import StarRating from "../components/StarRating";

export default function ReviewHistory() {
  const { userId: paramUserId } = useParams();
  const { user } = useAuth();
  const userId = paramUserId || user?.id;

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    api
      .get(`/reviews/history/${userId}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [userId]);

  if (error) {
    return (
      <div className="page narrow">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }
  if (!data) return <div className="page">Loading...</div>;

  return (
    <div className="page narrow">
      <p>
        <Link to="/">← Back</Link>
      </p>
      <h1>Reviews & Ratings</h1>
      <p className="page-subtitle">Feedback left by past collaborators on completed excavation projects.</p>

      <div className="card">
        <StarRating value={data.average} readOnly count={data.count} size={26} />
      </div>

      {data.reviews.length === 0 ? (
        <p className="hint">No reviews yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {data.reviews.map((r) => (
            <div key={r._id} className="card" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <StarRating value={r.rating} readOnly size={16} />
                <span className="hint">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: "0.5rem 0 0.25rem", fontWeight: 600 }}>
                {r.reviewer_name} <span style={{ fontWeight: 400, color: "#8a7a68" }}>({r.reviewer_role === "archaeologist" ? "Researcher" : "Excavation Team"})</span>
              </p>
              <p className="hint" style={{ margin: "0 0 0.5rem" }}>Project: {r.project_name}</p>
              {r.feedback && <p style={{ margin: 0 }}>{r.feedback}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
