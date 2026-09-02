// Public Archaeology Q&A - "My Questions" for the logged-in Public member
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, MessageSquare, MessagesSquare } from "lucide-react";
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
      <Link className="back-link" to="/qna">
        <ArrowLeft size={14} aria-hidden="true" /> Back to questions
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Public enquiries</span>
          <h1>My questions</h1>
          <p className="page-subtitle">
            Everything you have asked, and the answers each question has attracted.
          </p>
        </div>
        <Link to="/qna/ask" className="btn">
          <Plus size={16} aria-hidden="true" /> Ask a question
        </Link>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your questions
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <MessagesSquare size={26} aria-hidden="true" />
          <h3>You have not asked anything yet</h3>
          <p>Questions you publish appear here with the answers they receive.</p>
          <Link className="btn" to="/qna/ask">
            Ask a question
          </Link>
        </div>
      ) : (
        <ul className="record-list">
          {questions.map((q) => (
            <li key={q._id}>
              <Link to={`/qna/${q._id}`} className="record-row" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="record-main">
                  <h4>{q.title}</h4>
                  <p className="meta-row">
                    <span>
                      <MessageSquare size={12} aria-hidden="true" /> {q.answeredCount || 0} answer
                      {q.answeredCount === 1 ? "" : "s"}
                    </span>
                    <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="record-side">
                  <StatusBadge status={q.answeredCount > 0 ? "Answered" : "Open"} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
