// Ahad_23201016 - Add Artifact, moved out of the field report and into the
// active excavation project. Same fields as the Smart Artifact Search "Add
// Artifact" form, except the discovery location is fixed to wherever the
// original discovery report came from - the team can see it on the map but
// can't move the pin, so every find stays tied to the reported site.
import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import GoogleMapPicker from "./GoogleMapPicker";
import ArtifactImagePicker from "./ArtifactImagePicker";

const ARTIFACT_TYPES = [
  "Pottery",
  "Metal_Object",
  "Paintings",
  "Human_Remains",
  "Rock",
  "Jewelry",
  "Bone/Ivory",
  "other",
];

const EMPTY = {
  name: "",
  description: "",
  Type: "other",
  civilization: "",
  era: "",
  region: "",
  material: "",
  usage: "",
  discovery_date: "",
  picture: "",
};

export default function ArtifactFormModal({
  open,
  onClose,
  onSubmit,
  initial = null,
  location = null,
  siteName = "",
  busy = false,
  error = "",
}) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...EMPTY,
        ...initial,
        discovery_date: initial.discovery_date
          ? new Date(initial.discovery_date).toISOString().split("T")[0]
          : "",
      });
    } else {
      setForm({ ...EMPTY, discovery_date: new Date().toISOString().split("T")[0] });
    }
  }, [open, initial]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  }

  const hasCoords = location?.lat != null && location?.lng != null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Excavation record</span>
            <h2>{initial ? "Edit artifact record" : "Catalogue a recovered artifact"}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label>
            Artifact name
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Terracotta votive plaque"
              required
            />
          </label>

          <label>
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Condition, dimensions, decoration, and anything notable about the context"
            />
          </label>

          <label>
            Object class
            <select value={form.Type} onChange={(e) => set("Type", e.target.value)}>
              {ARTIFACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date recovered
            <input
              type="date"
              value={form.discovery_date}
              onChange={(e) => set("discovery_date", e.target.value)}
            />
          </label>

          <ArtifactImagePicker value={form.picture} onChange={(v) => set("picture", v)} />

          <div className="form-row">
            <label>
              Civilization
              <input value={form.civilization} onChange={(e) => set("civilization", e.target.value)} />
            </label>
            <label>
              Era
              <input value={form.era} onChange={(e) => set("era", e.target.value)} />
            </label>
            <label>
              Region
              <input value={form.region} onChange={(e) => set("region", e.target.value)} />
            </label>
            <label>
              Material
              <input value={form.material} onChange={(e) => set("material", e.target.value)} />
            </label>
            <label>
              Use
              <input value={form.usage} onChange={(e) => set("usage", e.target.value)} />
            </label>
          </div>

          <fieldset>
            <legend>Find location</legend>
            <p className="hint" style={{ margin: "0 0 0.6rem" }}>
              <MapPin size={13} style={{ verticalAlign: "middle" }} aria-hidden="true" /> Fixed to
              the discovery report this excavation was raised for{siteName ? ` — ${siteName}` : ""}.
            </p>
            {hasCoords ? (
              <>
                <GoogleMapPicker value={location} editable={false} height={220} />
                <p className="hint" style={{ margin: "0.5rem 0 0" }}>
                  {location.address || `${location.lat}, ${location.lng}`}
                </p>
              </>
            ) : (
              <p className="hint" style={{ margin: 0 }}>
                No map coordinates are recorded for this project.
              </p>
            )}
          </fieldset>

          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            Artifacts remain held by the project until the heritage authority reviews the completed
            excavation and allocates them to a museum or to auction.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Saving..." : initial ? "Save changes" : "Add to catalogue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
