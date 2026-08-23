import { useEffect, useState } from "react";
import { Plus, Trash2, History, ChevronDown, ChevronUp, Search } from "lucide-react";
import { api } from "../../api";
import SearchableSelect from "../../components/SearchableSelect";
import StatusBadge from "../../components/StatusBadge";
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
    });
  }

  async function saveEdit(itemId) {
    setSavingId(itemId);
    setError("");
    try {
      const data = await api.put(`/mm/my-museum-items/${itemId}`, form);
      setItems((prev) => prev.map((it) => (it._id === itemId ? data.item : it)));
      setEditingId(null);
      flashSuccess(`"${data.item.name}" was updated.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // Status toggles: instantly update if an item is moved to storage / display /
  // conservation / loan / transferred. Logged automatically in movement history.
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
      flashSuccess(`"${data.item.name}" was added to your inventory (ID: ${data.item.artifactId}).`);
      // Scroll up so the confirmation banner and the (now-closed) form area are in view.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(itemId) {
    if (!window.confirm("Remove this artifact from your museum inventory?")) return;
    setSavingId(itemId);
    setError("");
    try {
      await api.del(`/mm/my-museum-items/${itemId}`);
      await loadItems();
      flashSuccess("Artifact removed from your inventory.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (loading && items.length === 0) return <div className="page">Loading your museum artifacts...</div>;

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1>Museum Collection &amp; Artifact Inventory</h1>
          <p className="page-subtitle">
            Digital inventory with unique IDs — add, edit, remove, search, and track status, condition, ownership and movement history.
          </p>
        </div>
        <button type="button" className="btn" onClick={() => setShowAddForm((s) => !s)}>
          <Plus size={15} /> {showAddForm ? "Cancel" : "Add artifact"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Search & filter -------------------------------------------------- */}
      <div className="card">
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, artifact ID, or description..."
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn-small btn-outline-light" onClick={() => setShowFilters((s) => !s)}>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          {activeFilterCount > 0 && (
            <button type="button" className="btn-small btn-outline-light" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginTop: "0.75rem" }}>
            <label>
              Type
              <select value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
                <option value="">All types</option>
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
        )}
      </div>

      {/* Add new artifact --------------------------------------------------*/}
      {showAddForm && (
        <form className="card form" onSubmit={handleAddItem}>
          <label>
            Artifact name
            <input value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label>
              Type
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <label>Civilization <input value={newItem.civilization} onChange={(e) => setNewItem((p) => ({ ...p, civilization: e.target.value }))} /></label>
            <label>Era <input value={newItem.era} onChange={(e) => setNewItem((p) => ({ ...p, era: e.target.value }))} /></label>
            <label>Region <input value={newItem.region} onChange={(e) => setNewItem((p) => ({ ...p, region: e.target.value }))} /></label>
            <label>Material <input value={newItem.material} onChange={(e) => setNewItem((p) => ({ ...p, material: e.target.value }))} /></label>
            <label>Usage <input value={newItem.usage} onChange={(e) => setNewItem((p) => ({ ...p, usage: e.target.value }))} /></label>
          </div>
          <button type="submit" className="btn" disabled={adding}>
            {adding ? "Adding..." : "Add to inventory"}
          </button>
        </form>
      )}

      <h3>{loading ? "Loading..." : `${items.length} artifact(s)`}</h3>

      {items.length === 0 ? (
        <div className="card">
          <p className="hint">No artifacts match your search/filters.</p>
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <label>
                        Type
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <label>
                        Current location
                        <SearchableSelect
                          options={[...MUSEUMS]}
                          value={form.location}
                          onChange={(value) => setForm((p) => ({ ...p, location: value }))}
                          placeholder="Search location..."
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                      <label>Civilization <input value={form.civilization} onChange={(e) => setForm((p) => ({ ...p, civilization: e.target.value }))} /></label>
                      <label>Era <input value={form.era} onChange={(e) => setForm((p) => ({ ...p, era: e.target.value }))} /></label>
                      <label>Region <input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} /></label>
                      <label>Material <input value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} /></label>
                      <label>Usage <input value={form.usage} onChange={(e) => setForm((p) => ({ ...p, usage: e.target.value }))} /></label>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <button type="button" className="btn" onClick={() => saveEdit(item._id)} disabled={savingId === item._id}>
                        {savingId === item._id ? "Saving..." : "Save changes"}
                      </button>
                      <button type="button" className="btn-small btn-outline-light" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{item.name}</h3>
                        <p className="hint" style={{ margin: "0.25rem 0 0.2rem" }}>
                          {item.Type} &middot; ID: {item.artifactId || "—"}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <StatusBadge status={item.availability} />
                        <button type="button" className="btn-small btn-outline-light" onClick={() => openEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-small btn-outline-light"
                          onClick={() => handleDelete(item._id)}
                          disabled={savingId === item._id}
                          title="Remove from your museum inventory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Status toggles - instantly update, auto-logged to movement history */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "0.6rem 0" }}>
                      {AVAILABILITY_OPTIONS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className={item.availability === a ? "btn-small" : "btn-small btn-outline-light"}
                          disabled={savingId === item._id || item.availability === a}
                          onClick={() => setAvailability(item._id, a)}
                        >
                          {a}
                        </button>
                      ))}
                    </div>

                    <p style={{ margin: 0 }}>{item.description || "No description provided."}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.25rem 1rem", fontSize: "0.85rem", marginTop: "0.7rem" }}>
                      {item.civilization && <span>Civilization: {item.civilization}</span>}
                      {item.era && <span>Era: {item.era}</span>}
                      {item.region && <span>Region: {item.region}</span>}
                      {item.material && <span>Material: {item.material}</span>}
                      {item.usage && <span>Usage: {item.usage}</span>}
                      <span>Condition: {item.condition || "Good"}</span>
                      <span>Ownership: {item.ownership || "Government of Bangladesh"}</span>
                      {item.location && <span>Location: {item.location}</span>}
                    </div>

                    <button
                      type="button"
                      className="btn-small btn-outline-light"
                      style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                      onClick={() => setHistoryOpenId(isHistoryOpen ? null : item._id)}
                    >
                      <History size={14} /> Movement history ({(item.movementHistory || []).length})
                      {isHistoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isHistoryOpen && (
                      <div style={{ marginTop: "0.6rem", borderLeft: "2px solid var(--border, #e5e0d8)", paddingLeft: "0.9rem" }}>
                        {(item.movementHistory || []).length === 0 && <p className="hint">No movement recorded yet.</p>}
                        {[...(item.movementHistory || [])].reverse().map((h, i) => (
                          <div key={i} style={{ marginBottom: "0.6rem" }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem" }}>{h.action}</p>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "#777" }}>{fmtDate(h.date)}</p>
                            {h.note && <p style={{ margin: "0.15rem 0 0", fontSize: "0.85rem" }}>{h.note}</p>}
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