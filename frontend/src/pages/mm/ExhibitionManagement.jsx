import { useEffect, useRef, useState } from "react";
import { CalendarDays, Plus, Edit, Trash2, Upload, X, MapPin, ImagePlus } from "lucide-react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TYPES = [
  { value: "exhibition", label: "Exhibition" },
  { value: "educational_tour", label: "Educational tour" },
  { value: "cultural_event", label: "Cultural event" },
];

// Foreground colour for the status pill; the wash is derived from it.
const STATUS_COLORS = {
  draft: "#6f6254",
  published: "#1f6b2e",
  cancelled: "#b02020",
};

const STATUS_TINTS = {
  "#6f6254": "#f7f3ec",
  "#1f6b2e": "#eef9f0",
  "#b02020": "#fdeeee",
};

const STATUS_LABELS = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
};

const EMPTY_FORM = {
  title: "",
  type: "exhibition",
  description: "",
  image: "",
  location: null,
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  capacity: "",
  ticket_info: "",
  contact: "",
};

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ExhibitionManagement() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/mm/exhibitions");
      setExhibitions(data.exhibitions);
    } catch (err) {
      setError(err.message || "Your listings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalError("");
    setImageError("");
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || "",
      type: item.type || "exhibition",
      description: item.description || "",
      image: item.image || "",
      location: item.location?.lat != null ? item.location : null,
      start_date: item.start_date ? item.start_date.slice(0, 10) : "",
      end_date: item.end_date ? item.end_date.slice(0, 10) : "",
      start_time: item.start_time || "",
      end_time: item.end_time || "",
      capacity: item.capacity || "",
      ticket_info: item.ticket_info || "",
      contact: item.contact || "",
    });
    setModalError("");
    setImageError("");
    setShowModal(true);
  }

  async function handleSubmit(e, publish) {
    e.preventDefault();
    setModalError("");

    if (!form.title || !form.start_date || !form.end_date) {
      setModalError("A title, start date, and end date are required.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
      };

      if (editing) {
        await api.put(`/mm/exhibitions/${editing._id}`, payload);
      } else {
        await api.post("/mm/exhibitions", { ...payload, publish });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setModalError(err.message || "This listing could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImageFile(e) {
    setImageError("");
    const file = e.target.files?.[0];
    e.target.value = ""; 
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image too large. The limit is 1.5 MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({ ...f, image: dataUrl }));
  }

  function removeImage() {
    setForm((f) => ({ ...f, image: "" }));
    setImageError("");
  }

  async function handlePublishToggle(item) {
    try {
      const action = item.status === "published" ? "unpublish" : "publish";
      await api.patch(`/mm/exhibitions/${item._id}/${action}`);
      await load();
    } catch (err) {
      alert(err.message || "The status could not be updated.");
    }
  }

  async function handleCancel(item) {
    if (!window.confirm("Mark this listing as cancelled? It will show as cancelled to the public.")) return;
    try {
      await api.patch(`/mm/exhibitions/${item._id}/cancel`);
      await load();
    } catch (err) {
      alert(err.message || "This listing could not be cancelled.");
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await api.del(`/mm/exhibitions/${item._id}`);
      setExhibitions((prev) => prev.filter((e) => e._id !== item._id));
    } catch (err) {
      alert(err.message || "This listing could not be deleted.");
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Public programme</span>
          <h1>Exhibitions & events</h1>
          <p className="page-subtitle">
            Schedule exhibitions, educational tours, and cultural events. Publishing a listing makes
            it visible across the public register.
          </p>
        </div>
        <button className="btn" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" /> New listing
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your listings
        </div>
      ) : exhibitions.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={26} aria-hidden="true" />
          <h3>Nothing scheduled</h3>
          <p>Create a listing to publish an exhibition, tour, or event to the public register.</p>
          <button className="btn" onClick={openCreate}>
            New listing
          </button>
        </div>
      ) : (
        <div className="listing-grid">
          {exhibitions.map((item) => {
            const color = STATUS_COLORS[item.status] || "#6f6254";
            return (
              <div key={item._id} className="listing-card">
                {item.image && <img className="listing-image" src={item.image} alt="" loading="lazy" />}
                <div className="listing-body">
                  <div className="report-header" style={{ marginBottom: "0.35rem" }}>
                    <h4 style={{ margin: 0 }}>{item.title}</h4>
                    <span
                      className="status-badge"
                      style={{ color, backgroundColor: STATUS_TINTS[color] || "#f7f3ec" }}
                    >
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </div>

                  <p className="artifact-tile-class">
                    {TYPES.find((t) => t.value === item.type)?.label || item.type}
                  </p>

                  <p className="meta-row">
                    <span>
                      <CalendarDays size={13} aria-hidden="true" /> {fmtDate(item.start_date)} —{" "}
                      {fmtDate(item.end_date)}
                    </span>
                    {item.location?.address && (
                      <span>
                        <MapPin size={13} aria-hidden="true" /> {item.location.address}
                      </span>
                    )}
                  </p>

                  {item.description && (
                    <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", lineHeight: 1.55 }}>
                      {item.description}
                    </p>
                  )}

                  <div className="actions" style={{ marginTop: "1rem" }}>
                    <button className="btn-small btn-secondary" onClick={() => openEdit(item)}>
                      <Edit size={13} aria-hidden="true" /> Edit
                    </button>
                    {item.status !== "cancelled" && (
                      <button className="btn-small" onClick={() => handlePublishToggle(item)}>
                        <Upload size={13} aria-hidden="true" />{" "}
                        {item.status === "published" ? "Withdraw" : "Publish"}
                      </button>
                    )}
                    {item.status !== "cancelled" && (
                      <button className="btn-small btn-secondary" onClick={() => handleCancel(item)}>
                        Mark cancelled
                      </button>
                    )}
                    <button className="btn-small btn-danger" onClick={() => handleDelete(item)}>
                      <Trash2 size={13} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Public programme</span>
                <h2>{editing ? "Edit listing" : "New listing"}</h2>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={(e) => handleSubmit(e, false)} className="form">
              <label>
                Title
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </label>

              <label>
                Listing type
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>

              <div className="form-row">
                <label>
                  Start date
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} required />
                </label>
                <label>
                  End date
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} required />
                </label>
                <label>
                  Start time (optional)
                  <input placeholder="e.g. 10:00 AM" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
                </label>
                <label>
                  End time (optional)
                  <input placeholder="e.g. 5:00 PM" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
                </label>
                <label>
                  Capacity (optional)
                  <input type="number" min="0" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
                </label>
                <label>
                  Admission (optional)
                  <input placeholder="e.g. Free entry, or ৳50" value={form.ticket_info} onChange={(e) => setForm((f) => ({ ...f, ticket_info: e.target.value }))} />
                </label>
              </div>

              <label>
                Public contact (optional)
                <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
              </label>

              <label>
                Listing image (optional)
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  {form.image ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={form.image}
                        alt="Preview"
                        style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        title="Remove image"
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          background: "#c0392b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          cursor: "pointer",
                          lineHeight: "22px",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn-small btn-secondary" onClick={() => imageInputRef.current?.click()}>
                      <ImagePlus size={14} aria-hidden="true" /> Choose image
                    </button>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
                </div>
                {imageError && <p className="field-hint text-danger" style={{ margin: "0.3rem 0 0" }}>{imageError}</p>}
                <p className="hint" style={{ margin: "0.3rem 0 0" }}>JPG or PNG, up to 1.5 MB.</p>
              </label>

              <fieldset>
                <legend>Venue location</legend>
                <GoogleMapPicker
                  value={form.location}
                  onChange={(loc) => setForm((f) => ({ ...f, location: loc }))}
                  height={260}
                />
              </fieldset>

              <div className="modal-footer">
                <button type="submit" className="btn btn-secondary" disabled={busy}>
                  {busy ? "Saving" : editing ? "Save changes" : "Save as draft"}
                </button>
                {!editing && (
                  <button type="button" className="btn" disabled={busy} onClick={(e) => handleSubmit(e, true)}>
                    {busy ? "Saving" : "Save and publish"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}