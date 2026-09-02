import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import StarRating from "../components/StarRating";

const REVIEWER_LABELS = {
  archaeologist: "Archaeologist",
  excavation_team: "Excavation contractor",
};

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
  if (!data) {
    return (
      <div className="page narrow">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading performance record
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <Link className="back-link" to="/">
        <ArrowLeft size={14} aria-hidden="true" /> Back
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Performance record</span>
          <h1>Reviews & ratings</h1>
          <p className="page-subtitle">
            Assessments left by collaborators on completed excavation projects.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <span className="stat-label">Overall rating</span>
        <StarRating value={data.average} readOnly count={data.count} size={24} />
      </div>

      {data.reviews.length === 0 ? (
        <div className="empty-state">
          <Star size={24} aria-hidden="true" />
          <h3>No assessments yet</h3>
          <p>Reviews appear here once a collaborator rates a completed project.</p>
        </div>
      ) : (
        <>
          <div className="section-head">
            <h2>Individual assessments</h2>
            <span className="hint">{data.reviews.length} recorded</span>
          </div>
          <ul className="record-list">
            {data.reviews.map((r) => (
              <li className="record-row" key={r._id} style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <StarRating value={r.rating} readOnly size={15} />
                  <span className="hint">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: "0.55rem 0 0", fontWeight: 600 }}>
                  {r.reviewer_name}{" "}
                  <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                    ({REVIEWER_LABELS[r.reviewer_role] || r.reviewer_role})
                  </span>
                </p>
                <p className="record-meta">Project: {r.project_name}</p>
                {r.feedback && <p style={{ margin: "0.5rem 0 0" }}>{r.feedback}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
