// Ahad_23201016 - Add Artifact, moved out of the field report and into the
// active excavation project. Same fields as the Smart Artifact Search "Add
// Artifact" form, except the discovery location is fixed to wherever the
// original discovery report came from - the team can see it on the map but
// can't move the pin, so every find stays tied to the reported site.
import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import GoogleMapPicker from "./GoogleMapPicker";

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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", margin: 0 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>{initial ? "Edit Artifact" : "Add Artifact"}</h2>
          <button type="button" className="btn-link" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label>
            Artifact Name (required)
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </label>

          <label>
            Description
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>

          <label>
            Type
            <select value={form.Type} onChange={(e) => set("Type", e.target.value)}>
              {ARTIFACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Discovered Date
            <input
              type="date"
              value={form.discovery_date}
              onChange={(e) => set("discovery_date", e.target.value)}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
              Usage
              <input value={form.usage} onChange={(e) => set("usage", e.target.value)} />
            </label>
          </div>

          <fieldset>
            <legend>Discovery Location</legend>
            <p className="hint" style={{ margin: "0 0 0.6rem" }}>
              <MapPin size={13} style={{ verticalAlign: "middle" }} /> Set automatically from the
              discovery report this excavation was raised for{siteName ? ` - ${siteName}` : ""}.
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
                This project has no map coordinates recorded.
              </p>
            )}
          </fieldset>

          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            Artifacts stay with the project until the Government reviews the completed excavation
            and allocates them to a museum or to auction.
          </div>

          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Saving..." : initial ? "Save Changes" : "Add Artifact"}
          </button>
        </form>
      </div>
    </div>
  );
}
