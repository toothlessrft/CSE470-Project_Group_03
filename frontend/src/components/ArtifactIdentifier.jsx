// Docked launcher, bottom right. Upload a photo and get back a suggested
// civilization, class, era and material, plus the closest catalogue matches.
// Suggestions only, for a specialist to check - it never writes anything.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanSearch, X, Search, RotateCcw, ImagePlus, Info } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const MAX_SIZE = 1024 * 1024; // 1 MB, same cap as the discovery report uploader

const CONFIDENCE = {
  high: { className: "conf-high", label: "High confidence" },
  medium: { className: "conf-medium", label: "Moderate confidence" },
  low: { className: "conf-low", label: "Low confidence" },
};

const TAG_FIELDS = [
  ["civilization", "Civilization"],
  ["Type", "Object class"],
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
  // 503 means no API key is configured yet - setup, not a failure
  const [needsSetup, setNeedsSetup] = useState(false);
  const [result, setResult] = useState(null);

  // The backend requires a login, since identification costs an API call.
  if (!user) return null;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError("Choose a photograph smaller than 1 MB.");
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

  // Hand the tags to the catalogue search, which filters on these same fields.
  function searchCatalogue() {
    const s = result.suggestion;
    const usp = new URLSearchParams();
    ["civilization", "era", "region", "material", "usage"].forEach((field) => {
      if (s[field]) usp.set(field, s[field]);
    });
    setOpen(false);
    navigate(`/search?${usp.toString()}`);
  }

  // Open one comparable match on its own in the catalogue.
  function openInCatalogue(itemId) {
    setOpen(false);
    navigate(`/search?id=${itemId}`);
  }

  const suggestion = result?.suggestion;
  const confidence = CONFIDENCE[suggestion?.confidence] || CONFIDENCE.low;

  return (
    <>
      <button
        type="button"
        className="identify-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close artifact identification" : "Open artifact identification"}
      >
        {open ? <X size={17} aria-hidden="true" /> : <ScanSearch size={17} aria-hidden="true" />}
        <span>{open ? "Close" : "Identify a find"}</span>
      </button>

      {open && (
        <div className="identify-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Assisted identification</span>
              <h3>Identify a find</h3>
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>

          <div className="panel-body">
            <p className="hint" style={{ marginTop: 0 }}>
              Upload a photograph for a preliminary reading. Results are indicative only and must be
              confirmed by a specialist before any record is created.
            </p>

            {needsSetup && (
              <div className="alert alert-warning">
                <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong style={{ display: "block", marginBottom: "0.15rem" }}>
                    Service not configured
                  </strong>
                  Identification is not switched on yet. Add a <code>GEMINI_API_KEY</code> to{" "}
                  <code>backend/.env</code> and restart the backend.
                </span>
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {!result && (
              <>
                {image ? (
                  <div className="image-thumb" style={{ marginBottom: "0.75rem" }}>
                    <img src={image} alt="Photograph awaiting identification" />
                    <button
                      type="button"
                      className="image-remove"
                      onClick={reset}
                      aria-label="Remove photograph"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <label className="identify-drop">
                    <ImagePlus size={20} aria-hidden="true" />
                    <span>Choose a photograph</span>
                    <small>JPEG or PNG, up to 1 MB</small>
                    <input type="file" accept="image/*" hidden onChange={handleFile} />
                  </label>
                )}

                <label className="identify-hint-field">
                  Where was it found? (optional)
                  <input
                    type="text"
                    className="input"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="e.g. river bank near Comilla"
                    disabled={busy}
                  />
                </label>

                <button
                  className="btn identify-submit"
                  disabled={!image || busy}
                  onClick={identify}
                >
                  {busy ? "Analysing photograph" : "Run identification"}
                </button>
              </>
            )}

            {result && (
              <>
                {image && (
                  <div className="image-thumb" style={{ marginBottom: "0.75rem" }}>
                    <img src={image} alt="Identified artifact" />
                  </div>
                )}

                {!suggestion.identifiable ? (
                  <div className="alert alert-danger">{suggestion.summary}</div>
                ) : (
                  <>
                    <span className={`identify-confidence ${confidence.className}`}>
                      {confidence.label}
                    </span>

                    <dl className="identify-tags">
                      {TAG_FIELDS.map(([field, label]) =>
                        suggestion[field] ? (
                          <div key={field}>
                            <dt>{label}</dt>
                            <dd>{suggestion[field]}</dd>
                          </div>
                        ) : null
                      )}
                    </dl>

                    <p className="identify-summary">{suggestion.summary}</p>

                    {suggestion.alternatives?.length > 0 && (
                      <>
                        <h4 className="identify-subhead">Other possibilities</h4>
                        <ul className="identify-alts">
                          {suggestion.alternatives.map((alt, i) => (
                            <li key={i}>
                              <strong>
                                {[alt.civilization, alt.era].filter(Boolean).join(" — ") ||
                                  "Alternative"}
                              </strong>
                              {alt.note ? ` — ${alt.note}` : ""}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {suggestion.caution && (
                      <p className="identify-caution">
                        <strong>To confirm:</strong> {suggestion.caution}
                      </p>
                    )}

                    <h4 className="identify-subhead">
                      Comparable records in the catalogue ({result.similar.length})
                    </h4>
                    {result.similar.length === 0 ? (
                      <p className="hint" style={{ margin: 0 }}>
                        Nothing in the catalogue matches these attributes yet.
                      </p>
                    ) : (
                      <div className="identify-similar">
                        {result.similar.map((item) => (
                          <button
                            type="button"
                            className="identify-similar-row"
                            key={item._id}
                            onClick={() => openInCatalogue(item._id)}
                            title={`Open ${item.name} in the catalogue`}
                          >
                            {item.picture && (
                              <img
                                src={item.picture}
                                alt={item.name}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <strong>{item.name}</strong>
                              <p className="hint" style={{ margin: "0.1rem 0 0" }}>
                                {[item.civilization, item.era, item.site_name]
                                  .filter(Boolean)
                                  .join(" · ") || item.Type}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <button className="btn identify-submit" onClick={searchCatalogue}>
                      <Search size={14} aria-hidden="true" /> Search catalogue with these attributes
                    </button>
                  </>
                )}

                <button className="btn btn-secondary identify-submit" onClick={reset}>
                  <RotateCcw size={13} aria-hidden="true" /> Try another photograph
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
