import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  Camera,
  Film,
  LibraryBig,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

// The "public" flag means guests can see it without an account.
const CATEGORIES = [
  { id: "research_paper", label: "Research papers", icon: BookOpen, public: true },
  { id: "book", label: "Books", icon: Book, public: false },
  { id: "article", label: "Articles", icon: FileText, public: true },
  { id: "historical_reference", label: "Historical references", icon: History, public: false },
  { id: "vlog_audio", label: "Field diaries", icon: Clapperboard, public: false },
];

// Ahad_23201016 - mirrors the rule in backend/routes/knowledge.js.
const CATEGORY_UPLOAD_ROLES = {
  research_paper: ["archaeologist"],
  book: ["archaeologist"],
  article: ["archaeologist", "museum_manager"],
  historical_reference: ["archaeologist"],
  vlog_audio: ["archaeologist", "excavation_team"],
};

const ROLE_LABELS = {
  admin: "Heritage authority",
  archaeologist: "Archaeologist",
  museum_manager: "Museum authority",
  excavation_team: "Excavation contractor",
  public: "Public member",
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
  return { title: "", type: "", author: "", content: "", url: "", mediaType: "" };
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

  const uploadableCategories = CATEGORIES.filter((c) => canUploadTo(c.id));
  const canAddAnything = uploadableCategories.length > 0;

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchResources() {
    setLoading(true);
    setError("");
    try {
      const category = CATEGORIES.find((c) => c.id === activeTab);
      if (!user && category && !category.public) {
        setResources([]);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.set("type", activeTab);
      if (q) queryParams.set("q", q);

      const data = await api.get(`/knowledge?${queryParams.toString()}`);
      setResources(data.resources || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "The knowledge repository could not be loaded.");
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
    api
      .get(`/knowledge?${queryParams.toString()}`)
      .then((data) => setResources(data.resources || []))
      .catch((err) => setError(err.message || "The knowledge repository could not be loaded."))
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
      mediaType: resource.mediaType || "",
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
      setSubmitError("Attach a photograph or a video file.");
      e.target.value = "";
      return;
    }

    const maxBytes = isImage ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
    if (file.size > maxBytes) {
      setSubmitError(
        `File too large. The limit is ${Math.round(maxBytes / (1024 * 1024))} MB for a ${
          isImage ? "photograph" : "video"
        }.`
      );
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, url: dataUrl, mediaType: isImage ? "photo" : "video" }));
      setMediaFileName(file.name);
      setSubmitError("");
    } catch (err) {
      setSubmitError("That file could not be read. Try another.");
    }
    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!form.title.trim()) {
      setSubmitError("A title is required.");
      return;
    }
    if (!editingId && !form.type) {
      setSubmitError("Choose a category.");
      return;
    }
    if (form.type === "vlog_audio" && !form.url) {
      setSubmitError("Attach a photograph or video.");
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
          ...(form.type === "vlog_audio" ? { mediaType: form.mediaType } : {}),
        };
        const data = await api.put(`/knowledge/${editingId}`, payload);
        setResources((prev) => prev.map((r) => (r._id === editingId ? data.resource : r)));
      } else {
        const payload = {
          title: form.title.trim(),
          type: form.type,
          author: form.author.trim(),
          content: form.content.trim(),
          url: form.url.trim(),
          ...(form.type === "vlog_audio" ? { mediaType: form.mediaType } : {}),
        };
        const data = await api.post("/knowledge", payload);

        if (form.type === activeTab) {
          setResources((prev) => [data.resource, ...prev]);
        } else {
          setActiveTab(form.type);
        }
      }

      setShowModal(false);
      setForm(emptyForm());
      setMediaFileName("");
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "This material could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteResource(resourceId) {
    if (!window.confirm("Remove this material from the repository? This cannot be undone.")) return;
    try {
      await api.del(`/knowledge/${resourceId}`);
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch (err) {
      alert(err.message || "This material could not be removed.");
    }
  }

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab);
  const isTabLockedForGuest = !user && activeCategory && !activeCategory.public;
  const isEditingVlog = form.type === "vlog_audio";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Reference library</span>
          <h1>Knowledge hub</h1>
          <p className="page-subtitle">
            Excavation documentation, academic papers, historical references, and field diaries
            contributed by working researchers.
          </p>
        </div>
        {canAddAnything && (
          <button className="btn" onClick={openAddModal}>
            <Plus size={16} aria-hidden="true" /> Contribute material
          </button>
        )}
      </div>

      {!user && (
        <div className="alert alert-info">
          <Lock size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            You are browsing as a guest. <Link to="/login">Sign in</Link> or{" "}
            <Link to="/register">register</Link> to open every category.
          </span>
        </div>
      )}

      <div className="tabs">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isLocked = !user && !category.public;
          return (
            <button
              key={category.id}
              className={`tab ${activeTab === category.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(category.id)}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{category.label}</span>
              {isLocked && <Lock size={11} aria-hidden="true" style={{ opacity: 0.7 }} />}
            </button>
          );
        })}
      </div>

      {!isTabLockedForGuest && (
        <form onSubmit={handleSearchSubmit} className="home-search-row" style={{ marginBottom: "1.5rem" }}>
          <label className="home-search-field">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder={`Search ${activeCategory?.label.toLowerCase()} by title, author, or keyword`}
              aria-label={`Search ${activeCategory?.label}`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          {q && (
            <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>
              Clear
            </button>
          )}
          <button type="submit" className="btn">
            Search
          </button>
        </form>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {isTabLockedForGuest ? (
        <div className="empty-state">
          <Lock size={26} aria-hidden="true" />
          <h3>Restricted category</h3>
          <p>
            <strong>{activeCategory?.label}</strong> is available to registered accounts only.
            Access is restricted to protect research provenance and intellectual property.
          </p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link to="/login" className="btn">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Searching the repository
        </div>
      ) : resources.length === 0 ? (
        <div className="empty-state">
          <LibraryBig size={26} aria-hidden="true" />
          <h3>No material found</h3>
          <p>
            Nothing in {activeCategory?.label.toLowerCase()} matches your criteria
            {q ? ` for “${q}”` : ""}.
          </p>
        </div>
      ) : (
        <div className="knowledge-list">
          {resources.map((resource) => {
            const isOwner = user && resource.addedBy && resource.addedBy._id === user.id;
            const canEdit = isOwner;
            const canDelete = user && (user.role === "admin" || isOwner);

            return (
              <article className="knowledge-item" key={resource._id}>
                <div className="knowledge-item-head">
                  <div style={{ minWidth: 0 }}>
                    <h3>{resource.title}</h3>
                    {resource.author && <p className="record-meta">{resource.author}</p>}
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="actions">
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(resource)}
                          className="icon-btn"
                          aria-label={`Edit ${resource.title}`}
                        >
                          <Edit2 size={15} aria-hidden="true" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteResource(resource._id)}
                          className="icon-btn icon-btn-danger"
                          aria-label={`Remove ${resource.title}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {resource.content && <p className="knowledge-item-body">{resource.content}</p>}

                {/* Field diaries: render the uploaded photograph or video inline */}
                {resource.type === "vlog_audio" && resource.url && resource.mediaType === "photo" && (
                  <img className="knowledge-media" src={resource.url} alt={resource.title} />
                )}
                {resource.type === "vlog_audio" &&
                  resource.url &&
                  resource.mediaType === "video" &&
                  (resource.url.startsWith("data:") ? (
                    <video className="knowledge-media" src={resource.url} controls />
                  ) : (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-small btn-secondary"
                      style={{ width: "fit-content", marginBottom: "0.85rem" }}
                    >
                      <Film size={14} aria-hidden="true" /> Watch recording
                    </a>
                  ))}

                <div className="knowledge-item-foot">
                  <span>
                    Contributed by <strong>{resource.addedBy?.name || "Unattributed"}</strong>
                    {resource.addedBy?.role &&
                      ` · ${ROLE_LABELS[resource.addedBy.role] || resource.addedBy.role}`}
                  </span>

                  {resource.type !== "vlog_audio" && resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-small btn-secondary"
                    >
                      Open source <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Repository</span>
                <h2>{editingId ? "Edit material" : "Contribute material"}</h2>
              </div>
              <button onClick={closeModal} className="modal-close" aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="page-subtitle" style={{ marginTop: 0 }}>
              {editingId
                ? "Update the details of the material you contributed."
                : "Submit a document, reference link, or field recording to the shared repository."}
            </p>

            {submitError && <div className="alert alert-danger">{submitError}</div>}

            <form onSubmit={handleSubmit} className="form">
              <label>
                Title
                <input
                  type="text"
                  required
                  placeholder="e.g. Somapura terracotta seals: preliminary report"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <div className="form-row">
                <label>
                  Category
                  <select
                    value={form.type}
                    disabled={!!editingId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value, url: "", mediaType: "" }))
                    }
                  >
                    {!editingId && (
                      <option value="" disabled>
                        Choose a category
                      </option>
                    )}
                    {(editingId ? CATEGORIES : uploadableCategories).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Author or source
                  <input
                    type="text"
                    placeholder="e.g. Dr Alice Rahman"
                    value={form.author}
                    onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  />
                </label>
              </div>

              <label>
                Summary
                <textarea
                  rows={4}
                  placeholder="Scope of the work, principal findings, and periods or sites covered"
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                />
              </label>

              {isEditingVlog ? (
                <label>
                  Photograph or video
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem" }}>
                    <input type="file" accept="image/*,video/*" onChange={handleMediaFile} />
                    {form.mediaType === "photo" && (
                      <Camera size={16} aria-hidden="true" style={{ color: "var(--muted)" }} />
                    )}
                    {form.mediaType === "video" && (
                      <Film size={16} aria-hidden="true" style={{ color: "var(--muted)" }} />
                    )}
                  </div>
                  {(mediaFileName || form.url) && (
                    <p className="field-hint" style={{ margin: "0.4rem 0 0" }}>
                      {mediaFileName
                        ? `Selected: ${mediaFileName}`
                        : "Existing file kept — choose a new one to replace it."}
                    </p>
                  )}
                  {form.mediaType === "photo" && form.url && (
                    <img
                      src={form.url}
                      alt="Selected preview"
                      style={{ marginTop: "0.5rem", maxHeight: "140px", borderRadius: "var(--radius-sm)" }}
                    />
                  )}
                </label>
              ) : (
                <label>
                  Source link
                  <input
                    type="url"
                    placeholder="https://example.org/document.pdf"
                    value={form.url}
                    onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  />
                </label>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "Saving" : editingId ? "Save changes" : "Publish to repository"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
