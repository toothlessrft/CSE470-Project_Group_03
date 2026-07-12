import { useEffect, useState } from "react";
import { 
  Search, 
  Lock, 
  BookOpen, 
  Book, 
  FileText, 
  History, 
  Volume2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  X,
  Sparkles,
  UserCheck
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { id: "research_paper", label: "Research Papers", icon: BookOpen, public: true },
  { id: "book", label: "Books", icon: Book, public: false },
  { id: "article", label: "Articles", icon: FileText, public: false },
  { id: "historical_reference", label: "Historical References", icon: History, public: true },
  { id: "vlog_audio", label: "Vlogs & Audio Diaries", icon: Volume2, public: false }
];

export default function KnowledgeHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("research_paper");
  const [q, setQ] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modal state for adding a resource
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("research_paper");
  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchResources() {
    setLoading(true);
    setError("");
    try {
      // Check if we are trying to access a restricted tab as a guest
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
    // Fetch immediately after clearing
    const queryParams = new URLSearchParams();
    queryParams.set("type", activeTab);
    setLoading(true);
    api.get(`/knowledge?${queryParams.toString()}`)
      .then(data => setResources(data.resources || []))
      .catch(err => setError(err.message || "Failed to load knowledge resources."))
      .finally(() => setLoading(false));
  }

  async function handleAddResource(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    if (!newTitle.trim() || !newType) {
      setSubmitError("Title and resource type are required.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title: newTitle.trim(),
        type: newType,
        author: newAuthor.trim(),
        content: newContent.trim(),
        url: newUrl.trim()
      };

      const data = await api.post("/knowledge", payload);
      
      // If added resource matches the active tab, insert it immediately at the top
      if (newType === activeTab) {
        setResources(prev => [data.resource, ...prev]);
      } else {
        // Switch tab to the type created
        setActiveTab(newType);
      }

      // Reset form
      setNewTitle("");
      setNewType("research_paper");
      setNewAuthor("");
      setNewContent("");
      setNewUrl("");
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Could not add resource.");
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

  const canAdd = user && (user.role === "admin" || user.role === "archaeologist");

  return (
    <div className="page">
      {/* Premium Header Banner */}
      <section className="hero" style={{ background: "linear-gradient(135deg, #7c4a2d 0%, #3e1b0c 100%)", borderRadius: "16px", padding: "2.5rem" }}>
        <span className="hero-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Sparkles size={12} /> ArchiveEARTH Knowledge Hub
        </span>
        <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>Centralized Historical Library</h1>
        <p className="hero-subtitle">
          Access a curated repository of excavation documents, academic research papers, 
          historical records, audio field diaries, and vlogs shared directly by active field researchers.
        </p>
        
        {user ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.85rem" }}>
            <UserCheck size={14} className="text-success" />
            <span>Logged in as <strong>{user.name} ({user.role})</strong> · Full access unlocked</span>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(201, 138, 75, 0.2)", border: "1px solid var(--accent)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.85rem" }}>
            <Lock size={13} style={{ color: "var(--accent)" }} />
            <span>Browsing as Guest. <a href="/login" style={{ color: "var(--accent)", textDecoration: "underline", fontWeight: "600" }}>Login</a> or <a href="/register" style={{ color: "var(--accent)", textDecoration: "underline", fontWeight: "600" }}>Register</a> to unlock all books and vlogs.</span>
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

        {/* Add material button for authorized roles */}
        {canAdd && (
          <button className="btn" onClick={() => setShowAddModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: "999px" }}>
            <Plus size={16} /> Add Material
          </button>
        )}
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
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fdf8f4", border: "1.5px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContext: "center", justifyContent: "center", marginBottom: "1rem", color: "var(--accent)" }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem" }}>Private Knowledge Resource</h2>
          <p style={{ maxWidth: "480px", margin: "0 auto 1.5rem", color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            To view <strong>{activeCategory?.label}</strong>, you must possess a registered ArchiveEARTH account. Access is restricted to protect research provenance and intellectual property.
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
          {resources.map(resource => (
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
                
                {/* Delete button if authorized */}
                {(user && (user.role === "admin" || (resource.addedBy && resource.addedBy._id === user.id))) && (
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

              {resource.content && (
                <p style={{ margin: "0 0 1rem", fontSize: "0.92rem", lineHeight: 1.5, color: "var(--text)" }}>
                  {resource.content}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.75rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                <div>
                  Added by: <strong>{resource.addedBy?.name || "Unknown Researcher"}</strong>
                  {resource.addedBy?.role && ` (${resource.addedBy.role})`}
                </div>
                
                {resource.url && (
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
          ))}
        </div>
      )}

      {/* Add New Material Modal Overlay */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(43, 33, 24, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1.5rem" }}>
          <div className="card" style={{ maxWidth: "560px", width: "100%", margin: 0, padding: "2rem", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button 
              onClick={() => setShowAddModal(false)} 
              style={{ position: "absolute", top: "1rem", right: "1rem", border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Add Knowledge Material</h2>
            <p className="page-subtitle" style={{ marginBottom: "1.5rem" }}>Submit a document, reference link, audio log, or vlog into the repository.</p>
            
            {submitError && <div className="alert alert-danger" style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>{submitError}</div>}
            
            <form onSubmit={handleAddResource} className="form">
              <label>
                Title *
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Somapura Terracotta Seals Report" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label>
                  Category Type *
                  <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Author / Source
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Alice Rahman" 
                    value={newAuthor} 
                    onChange={(e) => setNewAuthor(e.target.value)} 
                  />
                </label>
              </div>

              <label>
                Description / Summary
                <textarea 
                  rows={4}
                  placeholder="Provide an overview of the findings, contents, or topics covered..." 
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)} 
                />
              </label>

              <label>
                Resource URL / Link
                <input 
                  type="url" 
                  placeholder="e.g. https://example.com/document.pdf or youtube link" 
                  value={newUrl} 
                  onChange={(e) => setNewUrl(e.target.value)} 
                />
              </label>

              <div className="actions" style={{ marginTop: "1rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" style={{ borderColor: "var(--border)", color: "var(--text)" }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
