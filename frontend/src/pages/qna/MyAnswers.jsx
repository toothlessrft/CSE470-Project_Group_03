// Public Archaeology Q&A - "My Answers" for the logged-in Archaeologist, with
// inline editing so they can fix an answer without leaving the list.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Edit2 } from "lucide-react";
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
      <p>
        <Link to="/qna" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <ArrowLeft size={14} /> Back to Q&amp;A
        </Link>
      </p>

      <h1>My Answers</h1>
      <p className="page-subtitle">Everything you've answered on Public Archaeology Q&amp;A. Edit anytime.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="hint">Loading...</p>
      ) : answers.length === 0 ? (
        <div className="card">
          <p className="hint" style={{ margin: 0 }}>
            You haven't answered any questions yet. Browse open questions on the Q&amp;A page.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {answers.map((a) => (
            <div className="card" key={a._id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                <div>
                  <Link to={`/qna/${a.question?._id}`} style={{ fontWeight: 600 }}>
                    {a.question?.title}
                  </Link>
                  <p className="hint" style={{ margin: "0.25rem 0 0" }}>
                    Asked by {a.question?.askedBy?.name || "a public member"} · Answered{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                    {a.edited && " (edited)"}
                  </p>
                </div>
                {editingId !== a._id && (
                  <button type="button" className="btn-link" onClick={() => startEdit(a)}>
                    <Edit2 size={13} /> Edit
                  </button>
                )}
              </div>

              {editingId === a._id ? (
                <div className="form" style={{ gap: "0.5rem", marginTop: "0.6rem" }}>
                  <textarea rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  <div className="actions">
                    <button type="button" className="btn-small" disabled={busy} onClick={() => saveEdit(a._id)}>
                      {busy ? "Saving..." : "Save"}
                    </button>
                    <button type="button" className="btn-link" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: "0.6rem 0 0", fontSize: "0.92rem", lineHeight: 1.5 }}>{a.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
