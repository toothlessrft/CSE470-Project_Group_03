import { useEffect, useState } from "react";
import { api } from "../../api";
import SearchableSelect from "../../components/SearchableSelect";
import { MUSEUMS } from "../../data/museums";

export default function MyMuseumArtifacts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
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
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/mm/my-museum-items");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(item) {
    setEditingId(item._id);
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
    });
  }

  async function saveEdit(itemId) {
    setSavingId(itemId);
    setError("");
    try {
      await api.put(`/mm/my-museum-items/${itemId}`, form);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="page">Loading your museum artifacts...</div>;

  return (
    <div className="page">
      <h1>My Museum Artifacts</h1>
      <p className="page-subtitle">View and edit artifacts assigned to your museum.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {items.length === 0 ? (
        <div className="card">
          <p className="hint">No artifacts are currently assigned to your museum.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {items.map((item) => {
            const isEditing = editingId === item._id;
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
                          <option value="Pottery">Pottery</option>
                          <option value="Metal_Object">Metal Object</option>
                          <option value="Paintings">Paintings</option>
                          <option value="Human_Remains">Human Remains</option>
                          <option value="Rock">Rock</option>
                          <option value="Jewelry">Jewelry</option>
                          <option value="Bone/Ivory">Bone / Ivory</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label>
                        Current location
                        <SearchableSelect
                          options={[...MUSEUMS]}
                          value={form.location}
                          onChange={(value) => setForm((p) => ({ ...p, location: value }))}
                          placeholder="Search location..."
                        />
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
                      <button type="button" className="btn-small btn-outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{item.name}</h3>
                        <p className="hint" style={{ margin: "0.25rem 0 0.7rem" }}>{item.Type}</p>
                      </div>
                      <button type="button" className="btn-small btn-outline" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                    </div>

                    <p style={{ margin: 0 }}>{item.description || "No description provided."}</p>
                    <p style={{ fontSize: "0.85rem", marginTop: "0.7rem" }}>
                      {item.civilization && <>Civilization: {item.civilization}<br /></>}
                      {item.era && <>Era: {item.era}<br /></>}
                      {item.region && <>Region: {item.region}<br /></>}
                      {item.material && <>Material: {item.material}<br /></>}
                      {item.usage && <>Usage: {item.usage}<br /></>}
                      {item.location && <>Current location: {item.location}</>}
                    </p>
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
