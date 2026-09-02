import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, LayoutGrid, X, Plus, Edit, Trash2 } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import ArtifactResultsMap from "../../components/ArtifactResultsMap";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import SearchableSelect from "../../components/SearchableSelect";
import { MUSEUMS, DEFAULT_LOCATION } from "../../data/museums";

const FIELD_LABELS = {
  civilization: "Civilization",
  era: "Era",
  region: "Region",
  material: "Material",
  usage: "Usage",
  location: "Current location",
};

export default function ArtifactSearch() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [q, setQ] = useState("");
  const [searchMode, setSearchMode] = useState(null);
  const [activeMuseumFilter, setActiveMuseumFilter] = useState(searchParams.get("museum") || "");
  const [filters, setFilters] = useState({ civilization: "", era: "", region: "", material: "", usage: "", location: "" });
  const [options, setOptions] = useState({ civilizations: [], eras: [], regions: [], materials: [], usages: [] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Which panel (if any) is expanded. Independent of what's actually driving
  // the current results - opening a panel does not run a search by itself.
  const [panelOpen, setPanelOpen] = useState(null); // null | "filters" | "map"

  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchLocation, setMapSearchLocation] = useState(null);
  const [mapSearchError, setMapSearchError] = useState("");
  const [mapSearchBusy, setMapSearchBusy] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState([]);

  // Add/Edit Artifact Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: "", picture: "", description: "", discovery_date: "", location: "",
    civilization: "", era: "", region: "", material: "", usage: "",
    latitude: "", longitude: "", site_name: ""
  });
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");


  useEffect(() => {
    api.get("/search/filters").then(setOptions);
    api.get("/search/map").then((data) => setSites(data.sites));
    runQuery({}); // show everything on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runQuery(params, mode = null) {
    setLoading(true);
    try {
      const usp = new URLSearchParams();
      const queryParams = { ...params };
      if (activeMuseumFilter) queryParams.museumName = activeMuseumFilter;
      Object.entries(queryParams).forEach(([k, v]) => v != null && v !== "" && usp.set(k, v));
      const data = await api.get(`/search/artifacts?${usp.toString()}`);
      setResults(data.results);
      if (mode) setSearchMode(mode);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const museumFilter = searchParams.get("museum") || "";
    setActiveMuseumFilter(museumFilter);

    if (museumFilter) {
      setQ("");
      setSelectedSite(null);
      setMapSearchLocation(null);
      setMapSearchQuery("");
      setFilters({ civilization: "", era: "", region: "", material: "", usage: "", location: "" });
      setSearchMode("museum");
      runQuery({ museumName: museumFilter }, "museum");
      return;
    }
    setSearchMode(null);
    runQuery({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- 1. Text bar: searches name/description/site/civilization/etc, ignores filters + map selection ---
  function handleTextSearch(e) {
    e.preventDefault();
    setSelectedSite(null);
    setMapSearchLocation(null);
    setMapSearchQuery("");
    setMapSearchError("");
    setMapSearchResults([]);
    runQuery({ q }, "text");
  }

  // --- 2. Filter panel: uses only the dropdown values, ignores the text bar + map selection ---
  function togglePanel(name) {
    setPanelOpen((current) => (current === name ? null : name));
  }

  function handleFilterChange(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  function applyFilters() {
    setSelectedSite(null);
    setMapSearchLocation(null);
    setMapSearchQuery("");
    setMapSearchError("");
    setMapSearchResults([]);
    runQuery({ ...filters }, "filters");
  }

  function clearFilters() {
    setFilters({ civilization: "", era: "", region: "", material: "", usage: "", location: "" });
    setSelectedSite(null);
    setMapSearchLocation(null);
    setMapSearchQuery("");
    setMapSearchError("");
    setMapSearchResults([]);
    setSearchMode(null);
    runQuery({});
  }

  // --- 3. Map panel: uses only the selected site, ignores the text bar + filters ---
  function handleSelectSite(site) {
    setSelectedSite(site);
    setMapSearchLocation(null);
    setMapSearchError("");
    setMapSearchResults([]);
    runQuery({ site: site._id }, "map");
  }

  function clearSiteFilter() {
    setSelectedSite(null);
    setMapSearchLocation(null);
    setMapSearchQuery("");
    setMapSearchError("");
    setMapSearchResults([]);
    setSearchMode(null);
    runQuery({});
  }

  async function handleMapLocationSearch() {
    const trimmed = mapSearchQuery.trim();
    if (!trimmed) return;

    setMapSearchError("");
    setMapSearchBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`
      );
      const data = await res.json();
      const results = Array.isArray(data) ? data : [];
      setMapSearchResults(results);

      if (results.length === 0) {
        setMapSearchLocation(null);
        setMapSearchError("No matching location found.");
        return;
      }

      const first = results[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setMapSearchLocation(null);
        setMapSearchError("That location could not be resolved.");
        return;
      }

      setSelectedSite(null);
      setMapSearchLocation({ lat, lng, label: first.display_name || trimmed });
      setPanelOpen("map");
      runQuery({ lat, lng, radius_km: 50 }, "map");
    } catch {
      setMapSearchLocation(null);
      setMapSearchResults([]);
      setMapSearchError("Could not search that location right now.");
    } finally {
      setMapSearchBusy(false);
    }
  }

  function selectMapSearchResult(result) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setMapSearchQuery(result.display_name || "");
    setMapSearchLocation({ lat, lng, label: result.display_name || "Selected location" });
    setMapSearchResults([]);
    setMapSearchError("");
    setSelectedSite(null);
    setPanelOpen("map");
    runQuery({ lat, lng, radius_km: 50 }, "map");
  }

  async function handleDeleteItem(id) {
    if (!window.confirm("Are you sure you want to delete this artifact? This cannot be undone.")) return;
    try {
      await api.del(`/items/${id}`);
      setResults((prev) => prev.filter((item) => item._id !== id));
      api.get("/search/map").then((data) => setSites(data.sites));
    } catch (err) {
      alert(err.message || "Could not delete artifact.");
    }
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    setModalError("");

    if (!itemForm.discovery_date || !itemForm.discovery_date.trim()) {
      setModalError("Please enter the discovered date.");
      return;
    }
    if (!itemForm.location || !itemForm.location.trim()) {
      setModalError("Please choose a current location (museum or Govt. Repository).");
      return;
    }
    if (itemForm.latitude === "" || itemForm.longitude === "") {
      setModalError("Please set the discovery location by clicking on the map.");
      return;
    }

    setModalBusy(true);
    try {
      if (editingItem) {
        await api.put(`/items/${editingItem._id}`, itemForm);
      } else {
        await api.post(`/items`, itemForm);
      }

      setShowModal(false);
      // Reload the currently active search method only. Do not merge other unrelated modes.
      if (searchMode === "filters") {
        runQuery({ ...filters }, "filters");
      } else if (searchMode === "map") {
        if (selectedSite) {
          runQuery({ site: selectedSite._id }, "map");
        } else if (mapSearchLocation) {
          runQuery({ lat: mapSearchLocation.lat, lng: mapSearchLocation.lng, radius_km: 50 }, "map");
        } else {
          runQuery({});
        }
      } else if (searchMode === "text") {
        runQuery({ q }, "text");
      } else if (activeMuseumFilter) {
        runQuery({ museumName: activeMuseumFilter }, "museum");
      } else {
        runQuery({});
      }
      api.get("/search/map").then((data) => setSites(data.sites));
      api.get("/search/filters").then(setOptions);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Smart Artifact Search</h1>
      <p className="page-subtitle">
        Explore the artifact catalogue by civilization, era, region, material, usage, or discovery location.
      </p>

      {!user && (
        <div className="alert alert-info">
          You're browsing as a guest, so descriptions are shortened and provenance details are hidden.{" "}
          <a href="/register">Register</a> or <a href="/login">log in</a> for full access to the knowledge hub.
        </div>
      )}

      {/* 1. Always-visible text search bar */}
      <form
        className="card"
        style={{ display: "flex", gap: "0.75rem", alignItems: "center", margin: "0 0 1.25rem" }}
        onSubmit={handleTextSearch}
      >
        <Search size={18} style={{ flexShrink: 0, color: "#8a7a68" }} />
        <input
          type="text"
          placeholder="Search any keyword - name, description, site, civilization, era..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            padding: "0.65rem 0.8rem",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.98rem",
            fontFamily: "inherit",
          }}
        />
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      {/* Buttons that reveal the filter panel / map panel - closed by default */}
      <div className="link-grid" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className={panelOpen === "filters" ? "btn" : "btn-small"} onClick={() => togglePanel("filters")}>
            <LayoutGrid size={15} /> Filter Search
          </button>
          <button className={panelOpen === "map" ? "btn" : "btn-small"} onClick={() => togglePanel("map")}>
            <MapPin size={15} /> Search by Location
          </button>
        </div>

        {user?.role === "archaeologist" && (
          <button className="btn" onClick={() => { setEditingItem(null); setItemForm({ name: "", picture: "", description: "", discovery_date: "", location: "", civilization: "", era: "", region: "", material: "", usage: "", latitude: "", longitude: "", site_name: "" }); setShowModal(true); setModalError(""); }}>
            <Plus size={15} /> Add Artifact
          </button>
        )}
      </div>

      {panelOpen === "filters" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <strong>Filter by tags</strong>
            <button className="btn-link" onClick={() => togglePanel("filters")}>
              <X size={14} /> Close
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <label key={field} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>
                {label}
                {field === "location" ? (
                  <SearchableSelect
                    options={[DEFAULT_LOCATION, ...MUSEUMS]}
                    value={filters.location}
                    onChange={(value) => handleFilterChange("location", value)}
                    placeholder="Search a museum or repository"
                  />
                ) : (
                  <select value={filters[field]} onChange={(e) => handleFilterChange(field, e.target.value)}>
                    <option value="">Any</option>
                    {options[`${field}s`]?.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            ))}
          </div>
          <div className="actions" style={{ marginTop: "1.25rem" }}>
            <button className="btn" onClick={applyFilters}>
              <Search size={15} /> Search with these filters
            </button>
            <button className="btn-small" onClick={clearFilters}>
              Reset
            </button>
          </div>
        </div>
      )}

      {panelOpen === "map" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <strong>Search by discovery location</strong>
            <button className="btn-link" onClick={() => togglePanel("map")}>
              <X size={14} /> Close
            </button>
          </div>
          <p className="page-subtitle" style={{ marginTop: 0 }}>
            Search a place name to center the map and view artifacts within about 50 km of it.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input
              type="text"
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Search for a location like Dhaka"
              style={{ flex: 1, padding: "0.6rem 0.7rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
            />
            <button type="button" className="btn-small" onClick={handleMapLocationSearch} disabled={mapSearchBusy}>
              {mapSearchBusy ? "Searching..." : "Search"}
            </button>
          </div>
          {mapSearchResults.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.75rem", display: "grid", gap: "0.35rem" }}>
              {mapSearchResults.map((result) => (
                <li
                  key={result.place_id || `${result.lat}-${result.lon}`}
                  onClick={() => selectMapSearchResult(result)}
                  style={{ padding: "0.55rem 0.7rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "#fff" }}
                >
                  {result.display_name}
                </li>
              ))}
            </ul>
          )}
          {mapSearchError && <div className="alert alert-danger" style={{ marginBottom: "0.75rem" }}>{mapSearchError}</div>}
          <ArtifactResultsMap
            sites={sites}
            selectedSiteId={selectedSite?._id}
            onSelectSite={handleSelectSite}
            searchLocation={mapSearchLocation}
          />
          {(selectedSite || mapSearchLocation) && (
            <p style={{ marginTop: "0.75rem" }}>
              {selectedSite ? (
                <>Showing artifacts from <strong>{selectedSite.name}</strong>.</>
              ) : (
                <>Showing artifacts within 50 km of <strong>{mapSearchLocation.label}</strong>.</>
              )}{" "}
              <button className="btn-link" onClick={() => { clearSiteFilter(); setMapSearchLocation(null); setMapSearchQuery(""); setMapSearchError(""); setMapSearchResults([]); }}>
                Clear
              </button>
            </p>
          )}
        </div>
      )}

      <h3>{loading ? "Searching..." : `${results.length} artifact(s) found`}</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        {results.map((item) => (
          <div key={item._id} className="card" style={{ margin: 0 }}>
            <h4 style={{ marginTop: 0, marginBottom: "0.4rem" }}>{item.name}</h4>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#8a7a68" }}>
              {item.Type} {item.site_name ? `· ${item.site_name}` : ""}
            </p>
            <p style={{ fontSize: "0.9rem" }}>{item.description || "No description available."}</p>
            <p style={{ fontSize: "0.85rem" }}>
              {item.civilization && <>Civilization: {item.civilization}<br /></>}
              {item.era && <>Era: {item.era}<br /></>}
              {item.region && <>Region: {item.region}<br /></>}
              {item.material && <>Material: {item.material}<br /></>}
              {item.usage && <>Usage: {item.usage}</>}
            </p>
            {item.limited ? (
              <p style={{ fontSize: "0.8rem", color: "#b5834d" }}>
                Log in to see discovery date, exact location, and full details.
              </p>
            ) : (
              <p style={{ fontSize: "0.8rem", color: "#777" }}>
                {item.discovery_date && <>Discovered: {item.discovery_date.slice(0, 10)}<br /></>}
                {item.location && <>Current Location: {item.location}<br /></>}
                {item.district && <>Site Location: {item.thana ? `${item.thana}, ` : ""}{item.district}</>}
              </p>
            )}

            {(user?.role === "archaeologist" ||
              (user?.role === "museum_manager" &&
                item.allocation === "Museum" &&
                (item.museumName === user?.museum_name || item.location === user?.museum_name))) && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button
                  className="btn-small btn-outline"
                  style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                  onClick={() => {
                    setEditingItem(item);
                    setItemForm({
                      name: item.name || "",
                      picture: item.picture || "",
                      description: item.description || "",
                      discovery_date: item.discovery_date ? new Date(item.discovery_date).toISOString().split("T")[0] : "",
                      location: item.location || "",
                      civilization: item.civilization || "",
                      era: item.era || "",
                      region: item.region || "",
                      material: item.material || "",
                      usage: item.usage || "",
                      latitude: item.latitude ?? "",
                      longitude: item.longitude ?? "",
                      site_name: item.site_name || ""
                    });
                    setModalError("");
                    setShowModal(true);
                  }}
                >
                  <Edit size={14} /> Edit
                </button>
                {user?.role === "archaeologist" && (
                  <button
                    className="btn-small"
                    style={{ color: "#fff", background: "var(--danger, #c0392b)", border: "none" }}
                    onClick={() => handleDeleteItem(item._id)}
                    title="Delete artifact"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {!loading && results.length === 0 && <p>No artifacts match this search yet.</p>}
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2>{editingItem ? "Edit Artifact" : "Add New Artifact"}</h2>
              <button className="btn-link" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={handleModalSubmit} className="form">
              <label>Artifact Name (required) <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} required /></label>
              <label>Description <textarea rows={3} value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} /></label>
              <label>
                Discovered Date (required)
                <input type="date" value={itemForm.discovery_date} onChange={e => setItemForm(f => ({ ...f, discovery_date: e.target.value }))} required />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label>Civilization <input value={itemForm.civilization} onChange={e => setItemForm(f => ({ ...f, civilization: e.target.value }))} /></label>
                <label>Era <input value={itemForm.era} onChange={e => setItemForm(f => ({ ...f, era: e.target.value }))} /></label>
                <label>Region <input value={itemForm.region} onChange={e => setItemForm(f => ({ ...f, region: e.target.value }))} /></label>
                <label>Material <input value={itemForm.material} onChange={e => setItemForm(f => ({ ...f, material: e.target.value }))} /></label>
                <label>Usage <input value={itemForm.usage} onChange={e => setItemForm(f => ({ ...f, usage: e.target.value }))} /></label>
                <label>
                  Current Location (required)
                  <SearchableSelect
                    options={[DEFAULT_LOCATION, ...MUSEUMS]}
                    value={itemForm.location}
                    onChange={(v) => setItemForm((f) => ({ ...f, location: v }))}
                    placeholder="Type to search, or click to pick from the list"
                    required
                  />
                </label>
              </div>

              <fieldset>
                <legend>Discovery Location on Map (required)</legend>
                <p className="hint">
                  {editingItem
                    ? "Click anywhere on the map, or drag the pin, to update where this artifact was discovered."
                    : "Click anywhere on the map, or drag the pin, to set where this artifact was discovered."}
                </p>
                <GoogleMapPicker
                  value={itemForm.latitude !== "" && itemForm.longitude !== "" ? { lat: parseFloat(itemForm.latitude), lng: parseFloat(itemForm.longitude) } : null}
                  onChange={({ lat, lng, address }) =>
                    setItemForm((f) => ({ ...f, latitude: lat, longitude: lng, site_name: address || f.site_name }))
                  }
                  height={280}
                />
              </fieldset>

              <button type="submit" className="btn" disabled={modalBusy}>
                {modalBusy ? "Saving..." : (editingItem ? "Save Changes" : "Create Artifact")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
