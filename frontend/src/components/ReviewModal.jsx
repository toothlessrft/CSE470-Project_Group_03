import { useEffect, useState } from "react";
import { api } from "../api";
import StarRating from "./StarRating";

/*
  Used two ways:
  1. Inline, right after an archaeologist/excavation team marks a project
     complete (see ProjectDetail.jsx) - `onClose` just dismisses the popup.
  2. As the target of a "Report submitted, rate your partner" notification
     (see pages/SubmitReview.jsx), which renders this full-page.
*/
export default function ReviewModal({ projectId, onClose, onSubmitted }) {
  const [context, setContext] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/reviews/project/${projectId}`)
      .then(setContext)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/reviews/project/${projectId}`, { rating, feedback });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 460 }}>
        {loading ? (
          <p className="loading-state">
            <span className="spinner" aria-hidden="true" /> Loading review details
          </p>
        ) : error && !context ? (
          <>
            <div className="alert alert-danger">{error}</div>
            {onClose && (
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            )}
          </>
        ) : done || context?.already_reviewed ? (
          <>
            <h3 style={{ marginTop: 0 }}>
              {done ? "Review recorded" : "Review already submitted"}
            </h3>
            <p className="page-subtitle">
              Your assessment of {context?.reviewee_name} has been added to their performance
              record{done ? "" : " previously"}.
            </p>
            {onClose && (
              <button className="btn" onClick={onClose}>
                Done
              </button>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginTop: 0 }}>Assess your collaborator</h3>
            <p className="page-subtitle" style={{ marginTop: 0 }}>
              Rate how <strong>{context?.reviewee_name}</strong> performed on{" "}
              <strong>{context?.project?.p_name}</strong>. Reviews are visible on their public
              profile.
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ margin: "1rem 0" }}>
              <span className="stat-label">Overall rating</span>
              <StarRating value={rating} onChange={setRating} size={26} />
            </div>

            <label>
              Written feedback (optional)
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Punctuality, field discipline, quality of recording, communication"
                rows={4}
              />
            </label>

            <div className="modal-footer">
              {onClose && (
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
                  Not now
                </button>
              )}
              <button type="submit" className="btn" disabled={busy}>
                {busy ? "Recording..." : "Submit assessment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
