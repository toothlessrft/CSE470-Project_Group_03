// Public Archaeology Q&A - one question's full thread
import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User as UserIcon, Edit2, MessageSquare, Send } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";

export default function QuestionDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [answerBody, setAnswerBody] = useState("");
  const [answerBusy, setAnswerBusy] = useState(false);
  const [answerError, setAnswerError] = useState("");

  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/qna/questions/${id}`)
      .then((d) => {
        setQuestion(d.question);
        setAnswers(d.answers || []);
        setComments(d.comments || []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  async function submitAnswer(e) {
    e.preventDefault();
    setAnswerError("");
    if (!answerBody.trim()) return;
    setAnswerBusy(true);
    try {
      await api.post(`/qna/questions/${id}/answers`, { body: answerBody.trim() });
      setAnswerBody("");
      load();
    } catch (err) {
      setAnswerError(err.message);
    } finally {
      setAnswerBusy(false);
    }
  }

  function startEdit(answer) {
    setEditingAnswerId(answer._id);
    setEditBody(answer.body);
  }

  async function saveEdit(answerId) {
    if (!editBody.trim()) return;
    setEditBusy(true);
    try {
      await api.patch(`/qna/answers/${answerId}`, { body: editBody.trim() });
      setEditingAnswerId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditBusy(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    setCommentError("");
    if (!commentBody.trim()) return;
    setCommentBusy(true);
    try {
      await api.post(`/qna/questions/${id}/comments`, { body: commentBody.trim() });
      setCommentBody("");
      load();
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentBusy(false);
    }
  }

  if (loading && !question)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the question
        </div>
      </div>
    );
  if (!question)
    return (
      <div className="page">
        <div className="alert alert-danger">{error || "This question could not be found."}</div>
      </div>
    );

  return (
    <div className="page">
      <Link className="back-link" to="/qna">
        <ArrowLeft size={14} aria-hidden="true" /> Back to questions
      </Link>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="page-head">
        <div>
          <span className="eyebrow">Public enquiry</span>
          <h1>{question.title}</h1>
          <p className="meta-row">
            <span>
              <UserIcon size={12} aria-hidden="true" /> Asked by {question.askedBy?.name}
            </span>
            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
        <StatusBadge status={answers.length > 0 ? "Answered" : "Open"} />
      </div>

      <div className="card">
        {question.body && <p style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>{question.body}</p>}
        {question.images?.length > 0 && (
          <div className="image-grid" style={{ marginTop: "0.75rem" }}>
            {question.images.map((src, i) => (
              <div className="image-thumb" key={i}>
                <img src={src} alt={`Photograph ${i + 1} attached to the question`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answers */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            <MessageSquare size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.35rem" }} />
            {answers.length} answer{answers.length === 1 ? "" : "s"}
          </h3>
        </div>
        <div className="panel-body">

        {answers.length === 0 && (
          <p className="hint" style={{ margin: 0 }}>
            No answer yet. Questions are picked up by archaeologists working in the relevant period
            or region.
          </p>
        )}

        {answers.map((a) => {
          const isOwner = user && a.answeredBy?._id === user.id;
          const isEditing = editingAnswerId === a._id;
          return (
            <div key={a._id} style={{ borderTop: "1px solid var(--border)", padding: "0.9rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <p className="hint" style={{ margin: "0 0 0.4rem" }}>
                  <strong style={{ color: "var(--primary-dark)" }}>{a.answeredBy?.name}</strong>
                  {a.answeredBy?.roleProfile?.affiliation ? ` · ${a.answeredBy.roleProfile.affiliation}` : ""} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString()}
                  {a.edited && " (edited)"}
                </p>
                {isOwner && !isEditing && (
                  <button type="button" className="btn-small btn-secondary" onClick={() => startEdit(a)}>
                    <Edit2 size={13} aria-hidden="true" /> Revise
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="form" style={{ gap: "0.5rem" }}>
                  <textarea rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  <div className="actions">
                    <button type="button" className="btn-small" disabled={editBusy} onClick={() => saveEdit(a._id)}>
                      {editBusy ? "Saving" : "Save revision"}
                    </button>
                    <button
                      type="button"
                      className="btn-small btn-secondary"
                      onClick={() => setEditingAnswerId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6 }}>{a.body}</p>
              )}
            </div>
          );
        })}

        {user?.role === "archaeologist" && (
          <form onSubmit={submitAnswer} className="form" style={{ marginTop: "1.25rem" }}>
            {answerError && <div className="alert alert-danger">{answerError}</div>}
            <label>
              Your answer
              <textarea
                rows={4}
                placeholder="Answer plainly, and say where the evidence for it comes from"
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
              />
            </label>
            <button type="submit" className="btn" disabled={answerBusy || !answerBody.trim()}>
              {answerBusy ? "Publishing" : "Publish answer"}
            </button>
          </form>
        )}
        </div>
      </div>

      {/* Discussion / comments */}
      <div className="panel">
        <div className="panel-head">
          <h3>Discussion ({comments.length})</h3>
        </div>
        <div className="panel-body">

        {!user && (
          <p className="hint" style={{ marginTop: 0 }}>
            <Link to="/login">Sign in</Link> to join this discussion.
          </p>
        )}

        {comments.map((c) => (
          <div key={c._id} style={{ borderTop: "1px solid var(--border)", padding: "0.7rem 0" }}>
            <p className="hint" style={{ margin: "0 0 0.25rem" }}>
              <strong style={{ color: "var(--primary-dark)" }}>{c.author?.name}</strong> ·{" "}
              {new Date(c.createdAt).toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="hint" style={{ margin: 0 }}>
            No comments on this question yet.
          </p>
        )}

        {user && commentError && (
          <div className="alert alert-danger" style={{ marginTop: "1rem", marginBottom: 0 }}>
            {commentError}
          </div>
        )}
        {user && (
          <form onSubmit={submitComment} className="home-search-row" style={{ marginTop: "1.25rem" }}>
            <label className="home-search-field">
              <input
                type="text"
                placeholder="Add to the discussion"
                aria-label="Add a comment"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
            </label>
            <button type="submit" className="btn" disabled={commentBusy || !commentBody.trim()}>
              <Send size={14} aria-hidden="true" /> Post
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
