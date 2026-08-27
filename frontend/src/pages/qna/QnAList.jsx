// Public Archaeology Q&A - browse/search (open to everyone, guests included)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Search, Plus, MessageSquare, User as UserIcon } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";

const FILTERS = [
  ["all", "All"],
  ["answered", "Answered"],
  ["unanswered", "Unanswered"],
];

export default function QnAList() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const isMyQuestions = filter === "mine";

  function load(query = q) {
    setLoading(true);

    // "My Questions" is its own endpoint (only the asker's own questions,
    // any status) rather than a server-side filter on the public list.
    if (filter === "mine") {
      api
        .get("/qna/my-questions")
        .then((d) => setQuestions(d.questions || []))
        .catch(() => setQuestions([]))
        .finally(() => setLoading(false));
      return;
    }

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filter !== "all") params.set("answered", filter === "answered" ? "true" : "false");
    api
      .get(`/qna/questions?${params.toString()}`)
      .then((d) => setQuestions(d.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [filter]);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="page">
      <div className="report-header">
        <div>
          <h1 style={{ margin: 0 }}>
            <HelpCircle size={22} style={{ verticalAlign: "middle" }} /> Public Archaeology Q&amp;A
          </h1>
          <p className="page-subtitle">Ask the experts. Archaeologists and researchers answer questions from the public.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {user?.role === "public" && (
            <Link to="/qna/ask" className="btn">
              <Plus size={14} /> Ask a Question
            </Link>
          )}
          {user?.role === "archaeologist" && (
            <Link to="/qna/my-answers" className="btn-small btn-outline-light">
              My Answers
            </Link>
          )}
        </div>
      </div>

      {!user && (
        <div className="alert alert-info">
          Browsing as a guest — you can read every question and answer here.{" "}
          <Link to="/login">Log in</Link> as a Public member to ask your own question, or comment and follow
          discussions.
        </div>
      )}

      {!isMyQuestions && (
        <form onSubmit={handleSearch} className="card" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Search size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search questions..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-small">
            Search
          </button>
        </form>
      )}

      <div className="tabs" style={{ margin: "1rem 0" }}>
        {FILTERS.map(([key, label]) => (
          <button key={key} className={`tab ${filter === key ? "tab-active" : ""}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
        {user?.role === "public" && (
          <button className={`tab ${isMyQuestions ? "tab-active" : ""}`} onClick={() => setFilter("mine")}>
            My Questions
          </button>
        )}
      </div>

      {loading ? (
        <p className="hint">Loading questions...</p>
      ) : questions.length === 0 ? (
        <div className="card">
          <p className="hint" style={{ margin: 0 }}>
            {isMyQuestions ? "You haven't asked any questions yet." : "No questions here yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {questions.map((qs) => (
            <Link
              to={`/qna/${qs._id}`}
              key={qs._id}
              className="card"
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                <h3 style={{ margin: "0 0 0.35rem" }}>{qs.title}</h3>
                <StatusBadge status={qs.answeredCount > 0 ? "Answered" : "Open"} />
              </div>
              {qs.body && (
                <p style={{ margin: "0 0 0.5rem", color: "var(--text)", fontSize: "0.9rem" }}>
                  {qs.body.slice(0, 180)}
                  {qs.body.length > 180 ? "…" : ""}
                </p>
              )}
              <p className="hint" style={{ margin: 0, display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <UserIcon size={12} /> {qs.askedBy?.name}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <MessageSquare size={12} /> {qs.answeredCount || 0} answer{qs.answeredCount === 1 ? "" : "s"}
                </span>
                <span>{new Date(qs.createdAt).toLocaleDateString()}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
