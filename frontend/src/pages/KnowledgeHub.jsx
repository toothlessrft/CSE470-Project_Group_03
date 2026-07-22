import { useEffect, useState } from "react";
import {
  Search,
  Lock,
  BookOpen,
  Book,
  FileText,
  History,
  Clapperboard,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  Sparkles,
  UserCheck,
  Camera,
  Film
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

// "public" flag = visible to guests (not logged in) without an account.
const CATEGORIES = [
  { id: "research_paper", label: "Research Papers", icon: BookOpen, public: true },
  { id: "book", label: "Books", icon: Book, public: false },
  { id: "article", label: "Articles", icon: FileText, public: true },
  { id: "historical_reference", label: "Historical References", icon: History, public: false },
  { id: "vlog_audio", label: "Vlog and Excavation Diaries", icon: Clapperboard, public: false }
];

// Mirrors the server-side rule in backend/routes/knowledge.js.
// "Researcher" is the same account as "archaeologist" (Register.jsx labels
// the archaeologist role "Archaeologist / Researcher"). "Excavation Team" is
// the "site_caretaker" role.
const CATEGORY_UPLOAD_ROLES = {
  research_paper: ["archaeologist"],
  book: ["archaeologist"],
  article: ["archaeologist", "museum_manager"],
  historical_reference: ["archaeologist"],
  vlog_audio: ["archaeologist", "site_caretaker"]
};

const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_VIDEO_BYTES = 8 * 1024 * 1024; // 8 MB

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function emptyForm() {
  return {
    title: "",
    type: "",
    author: "",
    content: "",
    url: "",
    mediaType: ""
  };
}

export default function KnowledgeHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("research_paper");
  const [q, setQ] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state (shared between Add and Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding, otherwise editing this resource id
  const [form, setForm] = useState(emptyForm());
  const [mediaFileName, setMediaFileName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function canUploadTo(typeId) {
    return !!user && (CATEGORY_UPLOAD_ROLES[typeId] || []).includes(user.role);
  }

  const uploadableCategories = CATEGORIES.filter(c => canUploadTo(c.id));
  const canAddAnything = uploadableCategories.length > 0;

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchResources() {
    setLoading(true);
    setError("");
    try {
      const category = CATEGORIES.find(c => c.id === activeTab);
      if (!user && category && !category.public) {
        setResources([]);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.set("type", activeTab);
      if (q) {
        queryParams.set("q", q);
      }

      const data = await api.get(`/knowledge?${queryParams.toString()}`);
      setResources(data.resources || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load knowledge resources.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchResources();
  }

  function handleClearSearch() {
    setQ("");
    const queryParams = new URLSearchParams();
    queryParams.set("type", activeTab);
    setLoading(true);
    api.get(`/knowledge?${queryParams.toString()}`)
      .then(data => setResources(data.resources || []))
      .catch(err => setError(err.message || "Failed to load knowledge resources."))
      .finally(() => setLoading(false));
  }

  function openAddModal() {
    // Default to the currently active tab if the user can upload to it,
    // otherwise fall back to their first available category.
    const defaultType = canUploadTo(activeTab) ? activeTab : uploadableCategories[0]?.id || "";
    setEditingId(null);
    setForm({ ...emptyForm(), type: defaultType });
    setMediaFileName("");
    setSubmitError("");
    setShowModal(true);
  }

  function openEditModal(resource) {
    setEditingId(resource._id);
    setForm({
      title: resource.title || "",
      type: resource.type,
      author: resource.author || "",
      content: resource.content || "",
      url: resource.url || "",
      mediaType: resource.mediaType || ""
    });
    setMediaFileName("");
    setSubmitError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleMediaFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setSubmitError("Please upload a photo or video file.");
      e.target.value = "";
      return;
    }

    const maxBytes = isImage ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
    if (file.size > maxBytes) {
      setSubmitError(`File is too large. Max size is ${Math.round(maxBytes / (1024 * 1024))} MB for a ${isImage ? "photo" : "video"}.`);
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm(prev => ({ ...prev, url: dataUrl, mediaType: isImage ? "photo" : "video" }));
      setMediaFileName(file.name);
      setSubmitError("");
    } catch (err) {
      setSubmitError("Could not read that file, please try again.");
    }
    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!form.title.trim()) {
      setSubmitError("Title is required.");
      return;
    }
    if (!editingId && !form.type) {
      setSubmitError("Please choose a category.");
      return;
    }
    if (form.type === "vlog_audio" && !form.url) {
      setSubmitError("Please attach a photo or video.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const payload = {
          title: form.title.trim(),
          author: form.author.trim(),
          content: form.content.trim(),
          url: form.url.trim(),
          ...(form.type === "vlog_audio" ? { mediaType: form.mediaType } : {})
        };
        const data = await api.put(`/knowledge/${editingId}`, payload);
        setResources(prev => prev.map(r => (r._id === editingId ? data.resource : r)));
      } else {
        const payload = {
          title: form.title.trim(),
          type: form.type,
          author: form.author.trim(),
          content: form.content.trim(),
          url: form.url.trim(),
          ...(form.type === "vlog_audio" ? { mediaType: form.mediaType } : {})
        };
        const data = await api.post("/knowledge", payload);

        if (form.type === activeTab) {
          setResources(prev => [data.resource, ...prev]);
        } else {
          setActiveTab(form.type);
        }
      }

      setShowModal(false);
      setForm(emptyForm());
      setMediaFileName("");
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Could not save this material.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteResource(resourceId) {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await api.del(`/knowledge/${resourceId}`);
      setResources(prev => prev.filter(r => r._id !== resourceId));
    } catch (err) {
      alert(err.message || "Could not delete resource.");
    }
  }

  const activeCategory = CATEGORIES.find(c => c.id === activeTab);
  const isTabLockedForGuest = !user && activeCategory && !activeCategory.public;
  const isEditingVlog = form.type === "vlog_audio";

  return (
    <div className="page">
      {/* Premium Header Banner */}
      <section className="hero" style={{ background: "linear-gradient(135deg, #7c4a2d 0%, #3e1b0c 100%)", borderRadius: "16px", padding: "2.5rem" }}>
        <span className="hero-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Sparkles size={12} /> ArchiveEarth Knowledge Hub
        </span>
        <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>Centralized Historical Library</h1>
        <p className="hero-subtitle">
          Access a curated repository of excavation documents, academic research papers,
          historical records, and field diaries shared directly by active field researchers.
        </p>

        {user ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.85rem" }}>
            <UserCheck size={14} className="text-success" />
            <span>Logged in as <strong>{user.name} ({user.role})</strong> · Full access unlocked</span>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(201, 138, 75, 0.2)", border: "1px solid var(--accent)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.85rem" }}>
            <Lock size={13} style={{ color: "var(--accent)" }} />
            <span>Browsing as Guest. <a href="/login" style={{ color: "var(--accent)", textDecoration: "underline", fontWeight: "600" }}>Login</a> or <a href="/register" style={{ color: "var(--accent)", textDecoration: "underline", fontWeight: "600" }}>Register</a> to unlock all categories.</span>
          </div>
        )}
      </section>

      {/* Main Layout Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Animated Tabs */}
        <div className="tabs" style={{ margin: 0 }}>
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            const isLocked = !user && !category.public;
            return (
              <button
                key={category.id}
                className={`tab ${activeTab === category.id ? "tab-active" : ""}`}
                onClick={() => setActiveTab(category.id)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Icon size={14} />
                <span>{category.label}</span>
                {isLocked && <Lock size={12} style={{ opacity: 0.7 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar (only useful if tab is not locked) */}
      {!isTabLockedForGuest && (
        <form onSubmit={handleSearchSubmit} className="card" style={{ display: "flex", gap: "0.75rem", alignItems: "center", margin: "0 0 1.5rem", padding: "0.85rem 1.25rem" }}>
          <Search size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder={`Search within ${activeCategory?.label} (by title, author, keyword)...`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.95rem",
              fontFamily: "inherit"
            }}
          />
          {q && (
            <button type="button" className="btn-link" onClick={handleClearSearch} style={{ textDecoration: "none", color: "var(--muted)" }}>
              Clear
            </button>
          )}
          <button type="submit" className="btn" style={{ padding: "0.6rem 1.2rem" }}>Search</button>
        </form>
      )}

      {/* Primary Display Area */}
      {error && <div className="alert alert-danger">{error}</div>}

      {isTabLockedForGuest ? (
        /* Guest Locked State */
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 2rem", background: "linear-gradient(to bottom, #ffffff, #fcfaf7)", borderStyle: "dashed" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fdf8f4", border: "1.5px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", color: "var(--accent)" }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem" }}>Private Knowledge Resource</h2>
          <p style={{ maxWidth: "480px", margin: "0 auto 1.5rem", color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            To view <strong>{activeCategory?.label}</strong>, you must possess a registered ArchiveEarth account. Access is restricted to protect research provenance and intellectual property.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <a href="/login" className="btn">Sign In</a>
            <a href="/register" className="btn btn-outline" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>Create Account</a>
          </div>
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Searching archives...</div>
      ) : resources.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          No records found in {activeCategory?.label} matching your criteria.
        </div>
      ) : (
        /* List of Resources */
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
          {resources.map(resource => {
            const isOwner = user && resource.addedBy && resource.addedBy._id === user.id;
            const canEdit = isOwner;
            const canDelete = user && (user.role === "admin" || isOwner);

            return (
              <div
                key={resource._id}
                className="card"
                style={{
                  margin: 0,
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderLeft: "4px solid var(--primary)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  cursor: "default"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.15rem", color: "var(--primary-dark)" }}>{resource.title}</h3>
                    {resource.author && (
                      <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 500, color: "var(--muted)" }}>
                        Author/Publisher: {resource.author}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(resource)}
                        className="btn-link"
                        title="Edit Resource"
                        style={{ color: "var(--muted)", background: "none", border: "none", padding: "0.25rem", cursor: "pointer" }}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteResource(resource._id)}
                        className="btn-link text-danger"
                        title="Delete Resource"
                        style={{ color: "var(--danger)", background: "none", border: "none", padding: "0.25rem", cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {resource.content && (
                  <p style={{ margin: "0 0 1rem", fontSize: "0.92rem", lineHeight: 1.5, color: "var(--text)" }}>
                    {resource.content}
                  </p>
                )}

                {/* Excavation Diaries: render the uploaded photo/video inline */}
                {resource.type === "vlog_audio" && resource.url && resource.mediaType === "photo" && (
                  <img
                    src={resource.url}
                    alt={resource.title}
                    style={{ width: "100%", maxHeight: "360px", objectFit: "cover", borderRadius: "8px", marginBottom: "1rem" }}
                  />
                )}
                {resource.type === "vlog_audio" && resource.url && resource.mediaType === "video" && (
                  resource.url.startsWith("data:") ? (
                    <video
                      src={resource.url}
                      controls
                      style={{ width: "100%", maxHeight: "360px", borderRadius: "8px", marginBottom: "1rem", background: "#000" }}
                    />
                  ) : (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", borderRadius: "6px", background: "var(--accent)", marginBottom: "1rem", width: "fit-content" }}>
                      <Film size={14} /> Watch Video
                    </a>
                  )
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.75rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                  <div>
                    Added by: <strong>{resource.addedBy?.name || "Unknown Researcher"}</strong>
                    {resource.addedBy?.role && ` (${resource.addedBy.role})`}
                  </div>

                  {resource.type !== "vlog_audio" && resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-small"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        borderRadius: "6px",
                        background: "var(--accent)"
                      }}
                    >
                      View Resource <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating "Add Material" action button, bottom right */}
      {canAddAnything && (
        <button
          onClick={openAddModal}
          className="btn"
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            borderRadius: "999px",
            padding: "0.85rem 1.4rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            zIndex: 500
          }}
        >
          <Plus size={18} /> Add Material
        </button>
      )}

      {/* Add / Edit Material Modal Overlay */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(43, 33, 24, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1.5rem" }}>
          <div className="card" style={{ maxWidth: "560px", width: "100%", margin: 0, padding: "2rem", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button
              onClick={closeModal}
              style={{ position: "absolute", top: "1rem", right: "1rem", border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}
            >
              <X size={20} />
            </button>

            <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>{editingId ? "Edit Knowledge Material" : "Add Knowledge Material"}</h2>
            <p className="page-subtitle" style={{ marginBottom: "1.5rem" }}>
              {editingId
                ? "Update the details of your uploaded material."
                : "Submit a document, reference link, or excavation photo/video into the repository."}
            </p>

            {submitError && <div className="alert alert-danger" style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>{submitError}</div>}

            <form onSubmit={handleSubmit} className="form">
              <label>
                Title *
                <input
                  type="text"
                  required
                  placeholder="e.g. Somapura Terracotta Seals Report"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label>
                  Category Type *
                  <select
                    value={form.type}
                    disabled={!!editingId}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value, url: "", mediaType: "" }))}
                  >
                    {!editingId && <option value="" disabled>-- choose a category --</option>}
                    {(editingId ? CATEGORIES : uploadableCategories).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Author / Source
                  <input
                    type="text"
                    placeholder="e.g. Dr. Alice Rahman"
                    value={form.author}
                    onChange={(e) => setForm(prev => ({ ...prev, author: e.target.value }))}
                  />
                </label>
              </div>

              <label>
                Description / Summary
                <textarea
                  rows={4}
                  placeholder="Provide an overview of the findings, contents, or topics covered..."
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </label>

              {isEditingVlog ? (
                <label>
                  Photo or Video *
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem" }}>
                    <input type="file" accept="image/*,video/*" onChange={handleMediaFile} />
                    {form.mediaType === "photo" && <Camera size={16} style={{ color: "var(--muted)" }} />}
                    {form.mediaType === "video" && <Film size={16} style={{ color: "var(--muted)" }} />}
                  </div>
                  {(mediaFileName || form.url) && (
                    <p style={{ margin: "0.4rem 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                      {mediaFileName ? `Selected: ${mediaFileName}` : "Current file kept (choose a new one to replace it)"}
                    </p>
                  )}
                  {form.mediaType === "photo" && form.url && (
                    <img src={form.url} alt="preview" style={{ marginTop: "0.5rem", maxHeight: "140px", borderRadius: "6px" }} />
                  )}
                </label>
              ) : (
                <label>
                  Resource URL / Link
                  <input
                    type="url"
                    placeholder="e.g. https://example.com/document.pdf"
                    value={form.url}
                    onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                  />
                </label>
              )}

              <div className="actions" style={{ marginTop: "1rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" style={{ borderColor: "var(--border)", color: "var(--text)" }} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Submit Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
