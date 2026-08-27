// AI Artifact Identification
// Floating launcher in the bottom-right corner. Opens a panel where you upload
// a photo and get back a suggested civilization / type / era / material, plus
// the closest matches already in the catalogue. Everything it produces is a
// suggestion for a specialist to check - it never writes to the catalogue.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Search, RotateCcw } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const MAX_SIZE = 1024 * 1024; // 1 MB, same cap as the discovery report uploader

const CONFIDENCE_STYLES = {
  high: { background: "var(--success-bg)", color: "var(--success)", label: "High confidence" },
  medium: { background: "#fdf8f2", color: "#7c4a2d", label: "Medium confidence" },
  low: { background: "var(--danger-bg)", color: "var(--danger)", label: "Low confidence" },
};

const TAG_FIELDS = [
  ["civilization", "Civilization"],
  ["Type", "Artifact type"],
  ["era", "Era"],
  ["material", "Material"],
  ["region", "Region"],
  ["usage", "Likely use"],
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ArtifactIdentifier() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // 503 means the server has no API key yet - a setup step, not a failure
  const [needsSetup, setNeedsSetup] = useState(false);
  const [result, setResult] = useState(null);

  // Identification runs against a paid API, so the backend requires a login.
  if (!user) return null;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError("Please choose an image smaller than 1 MB.");
      return;
    }
    setError("");
    setResult(null);
    setImage(await fileToDataUrl(file));
  }

  async function identify() {
    if (!image) return;
    setBusy(true);
    setError("");
    try {
      const data = await api.post("/ai/identify", { image, hint });
      setResult(data);
    } catch (err) {
      if (err.status === 503) {
        setNeedsSetup(true);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setImage(null);
    setHint("");
    setResult(null);
    setError("");
    setNeedsSetup(false);
  }

  // Hands the suggested tags to Smart Artifact Search, which already filters
  // on exactly these fields.
  function searchCatalogue() {
    const s = result.suggestion;
    const usp = new URLSearchParams();
    ["civilization", "era", "region", "material", "usage"].forEach((field) => {
      if (s[field]) usp.set(field, s[field]);
    });
    setOpen(false);
    navigate(`/search?${usp.toString()}`);
  }

  const suggestion = result?.suggestion;
  const confidence = CONFIDENCE_STYLES[suggestion?.confidence] || CONFIDENCE_STYLES.low;

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Identify an artifact with AI"
        title="Identify an artifact with AI"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 1000,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "var(--primary)",
          color: "#fff",
          boxShadow: "var(--shadow-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1.5rem",
            zIndex: 1000,
            width: "min(380px, calc(100vw - 3rem))",
            maxHeight: "min(620px, calc(100vh - 8rem))",
            overflowY: "auto",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-hover)",
            padding: "1.15rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.15rem", fontSize: "1.05rem", color: "var(--primary)" }}>
            <Sparkles size={16} style={{ verticalAlign: "middle" }} /> Identify an Artifact
          </h3>
          <p className="hint" style={{ margin: "0 0 0.9rem", fontSize: "0.8rem" }}>
            Upload a photo for a preliminary AI reading. Always have a specialist confirm it.
          </p>

          {needsSetup && (
            <div
              style={{
                padding: "0.7rem 0.85rem",
                marginBottom: "0.75rem",
                background: "#fdf8f2",
                border: "1px solid #e6cdb2",
                borderLeft: "4px solid var(--accent)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.82rem",
              }}
            >
              <strong style={{ display: "block", color: "#7c4a2d", marginBottom: "0.2rem" }}>
                Setup needed
              </strong>
              Artifact identification is not switched on yet. Add a{" "}
              <code>GEMINI_API_KEY</code> to <code>backend/.env</code> and restart the backend.{" "}
              A free key comes from aistudio.google.com — no payment method needed.
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          {!result && (
            <>
              {image ? (
                <div className="image-thumb" style={{ marginBottom: "0.75rem" }}>
                  <img src={image} alt="artifact to identify" />
                  <button type="button" className="image-remove" onClick={reset}>
                    ×
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: "block",
                    padding: "1.5rem 1rem",
                    marginBottom: "0.75rem",
                    textAlign: "center",
                    border: "2px dashed var(--border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: "0.88rem",
                  }}
                >
                  + Choose a photo
                  <input type="file" accept="image/*" hidden onChange={handleFile} />
                </label>
              )}

              <label style={{ fontSize: "0.85rem" }}>
                Where was it found? (optional)
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="e.g. river bank near Comilla"
                  disabled={busy}
                />
              </label>

              <button
                className="btn"
                style={{ width: "100%", marginTop: "0.75rem" }}
                disabled={!image || busy}
                onClick={identify}
              >
                {busy ? "Analysing photo..." : "Identify Artifact"}
              </button>
            </>
          )}

          {result && (
            <>
              {image && (
                <div className="image-thumb" style={{ marginBottom: "0.75rem" }}>
                  <img src={image} alt="identified artifact" />
                </div>
              )}

              {!suggestion.identifiable ? (
                <div className="alert alert-danger" style={{ fontSize: "0.85rem" }}>
                  {suggestion.summary}
                </div>
              ) : (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.65rem",
                      borderRadius: "999px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background: confidence.background,
                      color: confidence.color,
                    }}
                  >
                    {confidence.label}
                  </span>

                  <table className="table" style={{ margin: "0.75rem 0", fontSize: "0.85rem" }}>
                    <tbody>
                      {TAG_FIELDS.map(([field, label]) =>
                        suggestion[field] ? (
                          <tr key={field}>
                            <th style={{ width: "42%" }}>{label}</th>
                            <td>{suggestion[field]}</td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>

                  <p style={{ fontSize: "0.85rem" }}>{suggestion.summary}</p>

                  {suggestion.alternatives?.length > 0 && (
                    <>
                      <h4 style={{ margin: "0.75rem 0 0.35rem", fontSize: "0.9rem" }}>
                        Other possibilities
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                        {suggestion.alternatives.map((alt, i) => (
                          <li key={i} style={{ marginBottom: "0.3rem" }}>
                            <strong>
                              {[alt.civilization, alt.era].filter(Boolean).join(" — ") || "Alternative"}
                            </strong>
                            {alt.note ? ` — ${alt.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {suggestion.caution && (
                    <p
                      className="hint"
                      style={{
                        margin: "0.75rem 0 0",
                        padding: "0.6rem 0.8rem",
                        background: "#fdf8f2",
                        borderLeft: "3px solid var(--accent)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.8rem",
                      }}
                    >
                      To confirm: {suggestion.caution}
                    </p>
                  )}

                  <h4 style={{ margin: "1rem 0 0.35rem", fontSize: "0.9rem" }}>
                    Similar discoveries ({result.similar.length})
                  </h4>
                  {result.similar.length === 0 ? (
                    <p className="hint" style={{ margin: 0, fontSize: "0.82rem" }}>
                      Nothing in the catalogue matches these tags yet.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {result.similar.map((item) => (
                        <div
                          key={item._id}
                          style={{
                            display: "flex",
                            gap: "0.55rem",
                            alignItems: "center",
                            padding: "0.5rem 0.7rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {item.picture && (
                            <img
                              src={item.picture}
                              alt={item.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                              style={{
                                width: "44px",
                                height: "44px",
                                objectFit: "cover",
                                borderRadius: "var(--radius-sm)",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div style={{ minWidth: 0 }}>
                          <strong>{item.name}</strong>
                          <p className="hint" style={{ margin: "0.1rem 0 0", fontSize: "0.76rem" }}>
                            {[item.civilization, item.era, item.site_name].filter(Boolean).join(" · ") ||
                              item.Type}
                          </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="btn"
                    style={{ width: "100%", marginTop: "0.85rem" }}
                    onClick={searchCatalogue}
                  >
                    <Search size={14} /> Search catalogue with these tags
                  </button>
                </>
              )}

              <button
                className="btn-small"
                style={{ width: "100%", marginTop: "0.5rem" }}
                onClick={reset}
              >
                <RotateCcw size={13} /> Try another photo
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
