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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "1rem",
      }}
    >
      <div className="card" style={{ maxWidth: 440, width: "100%" }}>
        {loading ? (
          <p>Loading...</p>
        ) : error && !context ? (
          <>
            <div className="alert alert-danger">{error}</div>
            {onClose && (
              <button className="btn-small" onClick={onClose}>
                Close
              </button>
            )}
          </>
        ) : done || context?.already_reviewed ? (
          <>
            <h3 style={{ marginTop: 0 }}>
              {done ? "Thanks for your feedback!" : "You've already reviewed this project"}
            </h3>
            <p className="page-subtitle">
              Your review of {context?.reviewee_name} has been recorded{done ? "" : " previously"}.
            </p>
            {onClose && (
              <button className="btn" onClick={onClose}>
                Done
              </button>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginTop: 0 }}>Rate your partner</h3>
            <p className="page-subtitle" style={{ marginTop: 0 }}>
              How was working with <strong>{context?.reviewee_name}</strong> on &quot;{context?.project?.p_name}&quot;?
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ margin: "1rem 0" }}>
              <StarRating value={rating} onChange={setRating} size={28} />
            </div>

            <label>
              Feedback (optional)
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="How did the collaboration go?"
                rows={4}
              />
            </label>

            <div className="actions" style={{ marginTop: "1rem" }}>
              <button type="submit" className="btn" disabled={busy}>
                {busy ? "Submitting..." : "Submit Review"}
              </button>
              {onClose && (
                <button type="button" className="btn-small" onClick={onClose} disabled={busy}>
                  Maybe later
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
