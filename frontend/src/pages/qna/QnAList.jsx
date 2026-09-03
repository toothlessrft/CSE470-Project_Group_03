// Public Archaeology Q&A - browse/search (open to everyone, guests included)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, MessageSquare, User as UserIcon, Info, MessagesSquare } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";

const FILTERS = [
  ["all", "All questions"],
  ["answered", "Answered"],
  ["unanswered", "Awaiting an answer"],
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Public enquiries</span>
          <h1>Ask an archaeologist</h1>
          <p className="page-subtitle">
            Questions from the public, answered by working archaeologists and researchers.
          </p>
        </div>
        <div className="actions">
          {user?.role === "public" && (
            <Link to="/qna/ask" className="btn">
              <Plus size={16} aria-hidden="true" /> Ask a question
            </Link>
          )}
          {user?.role === "archaeologist" && (
            <Link to="/qna/my-answers" className="btn btn-secondary">
              My answers
            </Link>
          )}
        </div>
      </div>

      {!user && (
        <div className="alert alert-info">
          <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            You are browsing as a guest and can read every question and answer.{" "}
            <Link to="/login">Sign in</Link> as a public member to ask your own question or join a
            discussion.
          </span>
        </div>
      )}

      {!isMyQuestions && (
        <form onSubmit={handleSearch} className="home-search-row">
          <label className="home-search-field">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search questions by keyword"
              aria-label="Search questions"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button type="submit" className="btn">
            Search
          </button>
        </form>
      )}

      <div className="tabs">
        {FILTERS.map(([key, label]) => (
          <button key={key} className={`tab ${filter === key ? "tab-active" : ""}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
        {user?.role === "public" && (
          <button className={`tab ${isMyQuestions ? "tab-active" : ""}`} onClick={() => setFilter("mine")}>
            My questions
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading questions
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <MessagesSquare size={26} aria-hidden="true" />
          <h3>{isMyQuestions ? "You have not asked anything yet" : "No questions here"}</h3>
          <p>
            {isMyQuestions
              ? "Questions you ask will appear here alongside the answers they receive."
              : "Nothing matches this view. Try another filter or a different keyword."}
          </p>
          {user?.role === "public" && (
            <Link className="btn" to="/qna/ask">
              Ask a question
            </Link>
          )}
        </div>
      ) : (
        <ul className="record-list">
          {questions.map((qs) => (
            <li key={qs._id}>
              <Link to={`/qna/${qs._id}`} className="record-row" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="record-main">
                  <h4>{qs.title}</h4>
                  {qs.body && (
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.875rem", lineHeight: 1.55 }}>
                      {qs.body.slice(0, 180)}
                      {qs.body.length > 180 ? "…" : ""}
                    </p>
                  )}
                  <p className="meta-row">
                    <span>
                      <UserIcon size={12} aria-hidden="true" /> {qs.askedBy?.name}
                    </span>
                    <span>
                      <MessageSquare size={12} aria-hidden="true" /> {qs.answeredCount || 0} answer
                      {qs.answeredCount === 1 ? "" : "s"}
                    </span>
                    <span>{new Date(qs.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="record-side">
                  <StatusBadge status={qs.answeredCount > 0 ? "Answered" : "Open"} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
