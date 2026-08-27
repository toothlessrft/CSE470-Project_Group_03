// Public Archaeology Q&A - "My Questions" for the logged-in Public member
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, MessageSquare } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

export default function MyQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/qna/my-questions")
      .then((d) => setQuestions(d.questions || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <p>
        <Link to="/qna" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <ArrowLeft size={14} /> Back to Q&amp;A
        </Link>
      </p>

      <div className="report-header">
        <h1 style={{ margin: 0 }}>My Questions</h1>
        <Link to="/qna/ask" className="btn">
          <Plus size={14} /> Ask a Question
        </Link>
      </div>

      {loading ? (
        <p className="hint">Loading...</p>
      ) : questions.length === 0 ? (
        <div className="card">
          <p className="hint" style={{ margin: 0 }}>
            You haven't asked any questions yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {questions.map((q) => (
            <Link
              to={`/qna/${q._id}`}
              key={q._id}
              className="card"
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                <h3 style={{ margin: "0 0 0.35rem" }}>{q.title}</h3>
                <StatusBadge status={q.answeredCount > 0 ? "Answered" : "Open"} />
              </div>
              <p className="hint" style={{ margin: 0, display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <MessageSquare size={12} /> {q.answeredCount || 0} answer{q.answeredCount === 1 ? "" : "s"}
                </span>
                <span>{new Date(q.createdAt).toLocaleDateString()}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
