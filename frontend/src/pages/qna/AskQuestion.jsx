// Public Archaeology Q&A - Public members ask a question, optionally with photos
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../../api";
import ImageUploader from "../../components/ImageUploader";

export default function AskQuestion() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Give your question a title.");
      return;
    }
    setBusy(true);
    try {
      const data = await api.post("/qna/questions", { title: title.trim(), body: body.trim(), images });
      navigate(`/qna/${data.question._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <p>
        <Link to="/qna" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <ArrowLeft size={14} /> Back to Q&amp;A
        </Link>
      </p>

      <h1>Ask a Question</h1>
      <p className="page-subtitle">Archaeologists and researchers on ArchiveEarth will answer directly here.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Title *
          <input
            type="text"
            required
            placeholder="e.g. What does a terracotta plaque tell us about Pala-era religion?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Details
          <textarea
            rows={5}
            placeholder="Add any context, what you found, where, and what you'd like to know..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label>
          Photos (optional)
          <ImageUploader images={images} onChange={setImages} />
        </label>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Posting..." : "Post Question"}
        </button>
      </form>
    </div>
  );
}
