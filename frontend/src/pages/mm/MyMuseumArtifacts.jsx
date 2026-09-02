import { useEffect, useState } from "react";
import { Plus, Trash2, History, ChevronDown, ChevronUp, Search, Archive } from "lucide-react";
import { api } from "../../api";
import SearchableSelect from "../../components/SearchableSelect";
import StatusBadge from "../../components/StatusBadge";
import ArtifactImagePicker from "../../components/ArtifactImagePicker";
import { MUSEUMS } from "../../data/museums";

const AVAILABILITY_OPTIONS = ["On Display", "In Storage", "Under Conservation", "On Loan", "Transferred"];
const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];
const TYPE_OPTIONS = ["Pottery", "Metal_Object", "Paintings", "Human_Remains", "Rock", "Jewelry", "Bone/Ivory", "other"];

const EMPTY_NEW_ITEM = {
  name: "",
  Type: "Pottery",
  description: "",
  civilization: "",
  era: "",
  region: "",
  material: "",
  usage: "",
  availability: "In Storage",
  condition: "Good",
  ownership: "Government of Bangladesh",
  location: "",
  picture: "",
};

const EMPTY_FILTERS = { q: "", type: "", availability: "", civilization: "", era: "", material: "", location: "" };

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MyMuseumArtifacts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [historyOpenId, setHistoryOpenId] = useState(null);

  // Shows a green confirmation banner for a few seconds, then clears it.
  function flashSuccess(message) {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(""), 4000);
  }

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    name: "",
    Type: "Pottery",
    description: "",
    civilization: "",
    era: "",
    region: "",
    material: "",
    usage: "",
    location: "",
    condition: "Good",
    ownership: "Government of Bangladesh",
    picture: "",
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function buildQuery() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/mm/my-museum-items${buildQuery()}`);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(item) {
    setEditingId(item._id);
    setHistoryOpenId(null);
    setForm({
      name: item.name || "",
      Type: item.Type || "Pottery",
      description: item.description || "",
      civilization: item.civilization || "",
      era: item.era || "",
      region: item.region || "",
      material: item.material || "",
      usage: item.usage || "",
      location: item.location || "",
      condition: item.condition || "Good",
      ownership: item.ownership || "Government of Bangladesh",
      picture: item.picture || "",
    });
  }

  async function saveEdit(itemId) {
    setSavingId(itemId);
    setError("");
    try {
      const data = await api.put(`/mm/my-museum-items/${itemId}`, form);
      setItems((prev) => prev.map((it) => (it._id === itemId ? data.item : it)));
      setEditingId(null);
      flashSuccess(`Record for "${data.item.name}" updated.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // Status toggles apply straight away and are written to movement history.
  async function setAvailability(itemId, availability) {
    setSavingId(itemId);
    setError("");
    try {
      const data = await api.patch(`/mm/my-museum-items/${itemId}/availability`, { availability });
      setItems((prev) => prev.map((it) => (it._id === itemId ? data.item : it)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const data = await api.post("/mm/my-museum-items", newItem);
      setNewItem(EMPTY_NEW_ITEM);
      setShowAddForm(false);
      await loadItems();
      flashSuccess(`"${data.item.name}" added to the collection register (ID ${data.item.artifactId}).`);
      // Scroll up so the confirmation banner is in view.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(itemId) {
    if (!window.confirm("Remove this artifact from your collection register?")) return;
    setSavingId(itemId);
    setError("");
    try {
      await api.del(`/mm/my-museum-items/${itemId}`);
      await loadItems();
      flashSuccess("Artifact removed from the collection register.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (loading && items.length === 0)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the collection register
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Museum authority</span>
          <h1>Collection register</h1>
          <p className="page-subtitle">
            Every artifact held by your museum, with its accession number, condition, ownership, and
            full movement history.
          </p>
        </div>
        <button type="button" className="btn" onClick={() => setShowAddForm((s) => !s)}>
          <Plus size={15} aria-hidden="true" /> {showAddForm ? "Cancel" : "Accession artifact"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Search & filter -------------------------------------------------- */}
      <div className="card">
        <div className="home-search-row">
          <label className="home-search-field">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name, accession number, or description"
              aria-label="Search the collection register"
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            />
          </label>
          <button type="button" className="btn btn-secondary" onClick={() => setShowFilters((s) => !s)}>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          {activeFilterCount > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="form" style={{ marginTop: "1rem" }}>
          <div className="form-row">
            <label>
              Object class
              <select value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
                <option value="">All classes</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={filters.availability} onChange={(e) => setFilters((p) => ({ ...p, availability: e.target.value }))}>
                <option value="">All statuses</option>
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              Civilization
              <input value={filters.civilization} onChange={(e) => setFilters((p) => ({ ...p, civilization: e.target.value }))} />
            </label>
            <label>
              Era
              <input value={filters.era} onChange={(e) => setFilters((p) => ({ ...p, era: e.target.value }))} />
            </label>
            <label>
              Material
              <input value={filters.material} onChange={(e) => setFilters((p) => ({ ...p, material: e.target.value }))} />
            </label>
            <label>
              Location
              <input value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))} />
            </label>
          </div>
          </div>
        )}
      </div>

      {/* Add new artifact --------------------------------------------------*/}
      {showAddForm && (
        <form className="card form" onSubmit={handleAddItem}>
          <h3 style={{ margin: 0 }}>Accession a new artifact</h3>
          <label>
            Artifact name
            <input value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <div className="form-row">
            <label>
              Object class
              <select value={newItem.Type} onChange={(e) => setNewItem((p) => ({ ...p, Type: e.target.value }))}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={newItem.availability} onChange={(e) => setNewItem((p) => ({ ...p, availability: e.target.value }))}>
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Condition
              <select value={newItem.condition} onChange={(e) => setNewItem((p) => ({ ...p, condition: e.target.value }))}>
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Current location
              <input
                value={newItem.location}
                onChange={(e) => setNewItem((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Gallery 2, Storage Room B"
              />
            </label>
          </div>
          <label>
            Ownership
            <input value={newItem.ownership} onChange={(e) => setNewItem((p) => ({ ...p, ownership: e.target.value }))} />
          </label>
          <label>
            Description
            <textarea rows={3} value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} />
          </label>
          <ArtifactImagePicker
            value={newItem.picture}
            onChange={(v) => setNewItem((p) => ({ ...p, picture: v }))}
          />
          <div className="form-row">
            <label>Civilization <input value={newItem.civilization} onChange={(e) => setNewItem((p) => ({ ...p, civilization: e.target.value }))} /></label>
            <label>Era <input value={newItem.era} onChange={(e) => setNewItem((p) => ({ ...p, era: e.target.value }))} /></label>
            <label>Region <input value={newItem.region} onChange={(e) => setNewItem((p) => ({ ...p, region: e.target.value }))} /></label>
            <label>Material <input value={newItem.material} onChange={(e) => setNewItem((p) => ({ ...p, material: e.target.value }))} /></label>
            <label>Use <input value={newItem.usage} onChange={(e) => setNewItem((p) => ({ ...p, usage: e.target.value }))} /></label>
          </div>
          <div className="actions">
            <button type="submit" className="btn" disabled={adding}>
              {adding ? "Accessioning" : "Add to register"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="section-head">
        <h2>Holdings</h2>
        <span className="hint">
          {loading ? "Loading" : `${items.length} artifact${items.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Archive size={24} aria-hidden="true" />
          <h3>No matching records</h3>
          <p>No artifacts in your register match the current search and filters.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {items.map((item) => {
            const isEditing = editingId === item._id;
            const isHistoryOpen = historyOpenId === item._id;
            return (
              <div key={item._id} className="card" style={{ margin: 0 }}>
                {isEditing ? (
                  <div className="form">
                    <label>
                      Artifact name
                      <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                    </label>
                    <div className="form-row">
                      <label>
                        Object class
                        <select value={form.Type} onChange={(e) => setForm((p) => ({ ...p, Type: e.target.value }))}>
                          {TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Condition
                        <select value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}>
                          {CONDITION_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        Current location
                        <SearchableSelect
                          options={[...MUSEUMS]}
                          value={form.location}
                          onChange={(value) => setForm((p) => ({ ...p, location: value }))}
                          placeholder="Start typing a location"
                        />
                      </label>
                      <label>
                        Ownership
                        <input value={form.ownership} onChange={(e) => setForm((p) => ({ ...p, ownership: e.target.value }))} />
                      </label>
                    </div>
                    <label>
                      Description
                      <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                    </label>
                    <ArtifactImagePicker
                      value={form.picture}
                      onChange={(v) => setForm((p) => ({ ...p, picture: v }))}
                    />
                    <div className="form-row">
                      <label>Civilization <input value={form.civilization} onChange={(e) => setForm((p) => ({ ...p, civilization: e.target.value }))} /></label>
                      <label>Era <input value={form.era} onChange={(e) => setForm((p) => ({ ...p, era: e.target.value }))} /></label>
                      <label>Region <input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} /></label>
                      <label>Material <input value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} /></label>
                      <label>Use <input value={form.usage} onChange={(e) => setForm((p) => ({ ...p, usage: e.target.value }))} /></label>
                    </div>
                    <div className="actions">
                      <button type="button" className="btn" onClick={() => saveEdit(item._id)} disabled={savingId === item._id}>
                        {savingId === item._id ? "Saving" : "Save changes"}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="report-header">
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0 }}>{item.name}</h3>
                        <p className="meta-row">
                          <span>{item.Type}</span>
                          <span className="num">Accession {item.artifactId || "not assigned"}</span>
                        </p>
                      </div>
                      <div className="record-side">
                        <StatusBadge status={item.availability} />
                        <button type="button" className="btn-small btn-secondary" onClick={() => openEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          onClick={() => handleDelete(item._id)}
                          disabled={savingId === item._id}
                          aria-label={`Remove ${item.name} from the register`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Status toggles - applied immediately and written to movement history */}
                    <div style={{ margin: "0.9rem 0" }}>
                      <span className="stat-label">Set status</span>
                      <div className="actions" style={{ marginTop: "0.35rem" }}>
                        {AVAILABILITY_OPTIONS.map((a) => (
                          <button
                            key={a}
                            type="button"
                            className={
                              item.availability === a ? "btn-small" : "btn-small btn-secondary"
                            }
                            aria-pressed={item.availability === a}
                            disabled={savingId === item._id || item.availability === a}
                            onClick={() => setAvailability(item._id, a)}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p style={{ margin: 0 }}>{item.description || "No description recorded."}</p>

                    <dl className="detail-list" style={{ marginTop: "1rem" }}>
                      {item.civilization && (
                        <div>
                          <dt>Civilization</dt>
                          <dd>{item.civilization}</dd>
                        </div>
                      )}
                      {item.era && (
                        <div>
                          <dt>Era</dt>
                          <dd>{item.era}</dd>
                        </div>
                      )}
                      {item.region && (
                        <div>
                          <dt>Region</dt>
                          <dd>{item.region}</dd>
                        </div>
                      )}
                      {item.material && (
                        <div>
                          <dt>Material</dt>
                          <dd>{item.material}</dd>
                        </div>
                      )}
                      {item.usage && (
                        <div>
                          <dt>Use</dt>
                          <dd>{item.usage}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Condition</dt>
                        <dd>{item.condition || "Good"}</dd>
                      </div>
                      <div>
                        <dt>Ownership</dt>
                        <dd>{item.ownership || "Government of Bangladesh"}</dd>
                      </div>
                      {item.location && (
                        <div>
                          <dt>Location</dt>
                          <dd>{item.location}</dd>
                        </div>
                      )}
                    </dl>

                    <button
                      type="button"
                      className="btn-small btn-secondary"
                      style={{ marginTop: "1rem" }}
                      aria-expanded={isHistoryOpen}
                      onClick={() => setHistoryOpenId(isHistoryOpen ? null : item._id)}
                    >
                      <History size={14} aria-hidden="true" /> Movement history (
                      {(item.movementHistory || []).length})
                      {isHistoryOpen ? (
                        <ChevronUp size={14} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={14} aria-hidden="true" />
                      )}
                    </button>

                    {isHistoryOpen && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          borderLeft: "2px solid var(--border)",
                          paddingLeft: "0.9rem",
                        }}
                      >
                        {(item.movementHistory || []).length === 0 && (
                          <p className="hint" style={{ margin: 0 }}>
                            No movement recorded yet.
                          </p>
                        )}
                        {[...(item.movementHistory || [])].reverse().map((h, i) => (
                          <div key={i} style={{ marginBottom: "0.7rem" }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>{h.action}</p>
                            <p className="hint" style={{ margin: 0 }}>
                              {fmtDate(h.date)}
                            </p>
                            {h.note && (
                              <p style={{ margin: "0.15rem 0 0", fontSize: "0.875rem" }}>{h.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}