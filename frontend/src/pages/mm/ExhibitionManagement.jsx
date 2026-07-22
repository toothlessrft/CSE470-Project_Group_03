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
  { value: "educational_tour", label: "Educational Tour" },
  { value: "cultural_event", label: "Cultural Event" },
];

const STATUS_COLORS = {
  draft: "#8a7a68",
  published: "#2e7d32",
  cancelled: "#c62828",
};

const EMPTY_FORM = {
  title: "",
  type: "exhibition",
  description: "",
  image: "",
  location: null, // { lat, lng, address }
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
      setError(err.message || "Could not load your exhibitions.");
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
      setModalError("Title, start date, and end date are required.");
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
      setModalError(err.message || "Could not save this listing.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImageFile(e) {
    setImageError("");
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image is too large. Please choose one under 1.5 MB.");
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
      alert(err.message || "Could not update status.");
    }
  }

  async function handleCancel(item) {
    if (!window.confirm("Mark this listing as cancelled?")) return;
    try {
      await api.patch(`/mm/exhibitions/${item._id}/cancel`);
      await load();
    } catch (err) {
      alert(err.message || "Could not cancel this listing.");
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await api.del(`/mm/exhibitions/${item._id}`);
      setExhibitions((prev) => prev.filter((e) => e._id !== item._id));
    } catch (err) {
      alert(err.message || "Could not delete this listing.");
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Exhibition Management</h1>
          <p className="page-subtitle">
            Schedule exhibitions, educational tours, and cultural events. Publish them to make them
            visible on Near Me and other public pages.
          </p>
        </div>
        <button className="btn" onClick={openCreate}>
          <Plus size={16} /> New Listing
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : exhibitions.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>You haven't scheduled anything yet. Click "New Listing" to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {exhibitions.map((item) => (
            <div key={item._id} className="card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <h4 style={{ margin: 0 }}>{item.title}</h4>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#fff",
                    background: STATUS_COLORS[item.status] || "#8a7a68",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "999px",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#8a7a68" }}>
                {TYPES.find((t) => t.value === item.type)?.label || item.type}
              </p>
              <p style={{ margin: 0, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <CalendarDays size={14} /> {fmtDate(item.start_date)} - {fmtDate(item.end_date)}
              </p>
              {item.location?.address && (
                <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "#777" }}>
                  <MapPin size={14} /> {item.location.address}
                </p>
              )}
              {item.description && (
                <p style={{ margin: 0, fontSize: "0.88rem" }}>{item.description}</p>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn-small btn-outline" onClick={() => openEdit(item)}>
                  <Edit size={14} /> Edit
                </button>
                {item.status !== "cancelled" && (
                  <button className="btn-small" onClick={() => handlePublishToggle(item)}>
                    <Upload size={14} /> {item.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                )}
                {item.status !== "cancelled" && (
                  <button className="btn-small btn-outline" onClick={() => handleCancel(item)}>
                    Cancel
                  </button>
                )}
                <button
                  className="btn-small"
                  style={{ color: "#fff", background: "var(--danger, #c0392b)", border: "none" }}
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
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
          <div className="card" style={{ width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0 }}>{editing ? "Edit Listing" : "New Listing"}</h2>
              <button className="btn-link" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={(e) => handleSubmit(e, false)} className="form">
              <label>
                Title
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </label>

              <label>
                Type
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                  Ticket info (optional)
                  <input placeholder="e.g. Free entry / BDT 50" value={form.ticket_info} onChange={(e) => setForm((f) => ({ ...f, ticket_info: e.target.value }))} />
                </label>
              </div>

              <label>
                Contact (optional)
                <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
              </label>

              <label>
                Image (optional)
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
                    <button type="button" className="btn-small btn-outline" onClick={() => imageInputRef.current?.click()}>
                      <ImagePlus size={14} /> Upload image
                    </button>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
                </div>
                {imageError && <p style={{ color: "#c0392b", fontSize: "0.82rem", margin: "0.3rem 0 0" }}>{imageError}</p>}
                <p className="hint" style={{ margin: "0.3rem 0 0" }}>JPG or PNG, up to 1.5 MB.</p>
              </label>

              <fieldset>
                <legend>Venue location (for "Near Me" discovery)</legend>
                <GoogleMapPicker
                  value={form.location}
                  onChange={(loc) => setForm((f) => ({ ...f, location: loc }))}
                  height={260}
                />
              </fieldset>

              <div className="actions" style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="submit" className="btn-outline" disabled={busy}>
                  {busy ? "Saving..." : editing ? "Save changes" : "Save as draft"}
                </button>
                {!editing && (
                  <button type="button" className="btn" disabled={busy} onClick={(e) => handleSubmit(e, true)}>
                    {busy ? "Saving..." : "Save & publish"}
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