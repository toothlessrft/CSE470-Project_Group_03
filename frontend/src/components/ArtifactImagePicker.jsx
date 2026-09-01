// Single artifact photograph picker. Item.picture is one string, so this keeps
// one image at a time: either an uploaded file (stored as a data URL, same as
// ImageUploader does for reports) or a pasted image link, since seeded
// catalogue records already hold plain URLs.
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_SIZE = 1024 * 1024; // 1 MB, matching ImageUploader

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ArtifactImagePicker({
  value = "",
  onChange,
  label = "Photograph",
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = (e.target.files || [])[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError("The photograph must be smaller than 1 MB.");
      return;
    }
    setError("");
    onChange(await fileToDataUrl(file));
  }

  return (
    <div className="image-uploader">
      <span className="stat-label">{label}</span>
      <div className="image-grid">
        {value ? (
          <div className="image-thumb">
            <img
              src={value}
              alt="Artifact photograph"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <button
              type="button"
              className="image-remove"
              onClick={() => {
                setError("");
                onChange("");
              }}
              aria-label="Remove photograph"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" className="image-add" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={17} aria-hidden="true" />
            Add photo
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <input
        type="url"
        value={value && value.startsWith("data:") ? "" : value}
        onChange={(e) => {
          setError("");
          onChange(e.target.value);
        }}
        placeholder="or paste an image link (https://...)"
        aria-label="Image link"
        disabled={Boolean(value) && value.startsWith("data:")}
      />
      {error ? (
        <p className="hint" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : (
        <p className="hint">
          One photograph, up to 1 MB. Upload a file or paste a link to an existing image.
        </p>
      )}
    </div>
  );
}
