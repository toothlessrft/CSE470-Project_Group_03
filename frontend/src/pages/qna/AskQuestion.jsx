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
      <Link className="back-link" to="/qna">
        <ArrowLeft size={14} aria-hidden="true" /> Back to questions
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Public enquiry</span>
          <h1>Ask a question</h1>
          <p className="page-subtitle">
            Working archaeologists and researchers answer questions directly on the register.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Question
          <input
            type="text"
            required
            placeholder="e.g. What does a terracotta plaque tell us about Pala-era religion?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Background
          <textarea
            rows={5}
            placeholder="What you saw, where, and what you would like to know about it"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label>
          Photographs (optional)
          <ImageUploader images={images} onChange={setImages} />
        </label>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Publishing" : "Publish question"}
        </button>
      </form>
    </div>
  );
}
