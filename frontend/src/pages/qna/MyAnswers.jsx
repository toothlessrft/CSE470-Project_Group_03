// Public Archaeology Q&A - "My Answers" for the logged-in Archaeologist, with
// inline editing so they can fix an answer without leaving the list.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Edit2, MessagesSquare } from "lucide-react";
import { api } from "../../api";

export default function MyAnswers() {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/qna/my-answers")
      .then((d) => setAnswers(d.answers || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEdit(a) {
    setEditingId(a._id);
    setEditBody(a.body);
    setError("");
  }

  async function saveEdit(id) {
    if (!editBody.trim()) return;
    setBusy(true);
    try {
      await api.patch(`/qna/answers/${id}`, { body: editBody.trim() });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <Link className="back-link" to="/qna">
        <ArrowLeft size={14} aria-hidden="true" /> Back to questions
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Public enquiries</span>
          <h1>My answers</h1>
          <p className="page-subtitle">
            Everything you have answered for the public. Answers can be revised at any time.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your answers
        </div>
      ) : answers.length === 0 ? (
        <div className="empty-state">
          <MessagesSquare size={26} aria-hidden="true" />
          <h3>No answers yet</h3>
          <p>Questions awaiting an answer are listed on the public enquiries page.</p>
          <Link className="btn" to="/qna">
            Browse open questions
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {answers.map((a) => (
            <div className="card" key={a._id} style={{ margin: 0 }}>
              <div className="report-header">
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0 }}>
                    <Link to={`/qna/${a.question?._id}`}>{a.question?.title}</Link>
                  </h4>
                  <p className="meta-row">
                    <span>Asked by {a.question?.askedBy?.name || "a public member"}</span>
                    <span>
                      Answered {new Date(a.createdAt).toLocaleDateString()}
                      {a.edited && " · revised"}
                    </span>
                  </p>
                </div>
                {editingId !== a._id && (
                  <button
                    type="button"
                    className="btn-small btn-secondary"
                    onClick={() => startEdit(a)}
                  >
                    <Edit2 size={13} aria-hidden="true" /> Revise
                  </button>
                )}
              </div>

              {editingId === a._id ? (
                <div className="form" style={{ gap: "0.6rem", marginTop: "0.85rem" }}>
                  <textarea rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  <div className="actions">
                    <button type="button" className="btn-small" disabled={busy} onClick={() => saveEdit(a._id)}>
                      {busy ? "Saving" : "Save revision"}
                    </button>
                    <button
                      type="button"
                      className="btn-small btn-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: "0.85rem 0 0", fontSize: "0.9375rem", lineHeight: 1.6 }}>{a.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
