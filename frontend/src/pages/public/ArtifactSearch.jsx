import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, LayoutGrid, X, Plus, Edit, Trash2, Info, Lock, PackageSearch } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import ArtifactResultsMap from "../../components/ArtifactResultsMap";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import SearchableSelect from "../../components/SearchableSelect";
import ArtifactImagePicker from "../../components/ArtifactImagePicker";
import { MUSEUMS, DEFAULT_LOCATION } from "../../data/museums";

const FIELD_LABELS = {
  civilization: "Civilization",
  era: "Era",
  region: "Region",
  material: "Material",
  usage: "Use",
  location: "Held at",
};

export default function ArtifactSearch() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState("");
  const [searchMode, setSearchMode] = useState(null);
  const [activeMuseumFilter, setActiveMuseumFilter] = useState(searchParams.get("museum") || "");
  const [filters, setFilters] = useState({ civilization: "", era: "", region: "", material: "", usage: "", location: "" });
  const [options, setOptions] = useState({ civilizations: [], eras: [], regions: [], materials: [], usages: [] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Which panel is expanded. Separate from what drives the current results -
  // opening a panel does not run a search on its own.
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
    // The searchParams effect below runs the opening query; a second one here
    // would race it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runQuery(params, mode = null) {
    setLoading(true);
    try {
      const usp = new URLSearchParams();
      const queryParams = { ...params };
      if (activeMuseumFilter && !params.id) queryParams.museumName = activeMuseumFilter;
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

    // One record opened directly, e.g. a match clicked in the AI identifier.
    // Overrides every other search mode.
    const artifactId = searchParams.get("id") || "";
    if (artifactId) {
      setQ("");
      setSelectedSite(null);
      setMapSearchLocation(null);
      setMapSearchQuery("");
      setFilters({ civilization: "", era: "", region: "", material: "", usage: "", location: "" });
      setPanelOpen(null);
      setSearchMode("artifact");
      runQuery({ id: artifactId }, "artifact");
      return;
    }

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
    // The AI identifier passes its tags as query params, so the filter panel
    // opens already filled in.
    const tagFields = ["civilization", "era", "region", "material", "usage"];
    const prefill = {};
    tagFields.forEach((field) => {
      const value = searchParams.get(field);
      if (value) prefill[field] = value;
    });

    if (Object.keys(prefill).length > 0) {
      const nextFilters = { civilization: "", era: "", region: "", material: "", usage: "", location: "", ...prefill };
      setQ("");
      setSelectedSite(null);
      setMapSearchLocation(null);
      setMapSearchQuery("");
      setFilters(nextFilters);
      setSearchMode("filters");
      runQuery(nextFilters, "filters");
      return;
    }

    setSearchMode(null);
    runQuery({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- 1. Text bar: name, description, site, civilization. Ignores the
  // filters and the map selection. ---
  function handleTextSearch(e) {
    e.preventDefault();
    setSelectedSite(null);
    setMapSearchLocation(null);
    setMapSearchQuery("");
    setMapSearchError("");
    setMapSearchResults([]);
    runQuery({ q }, "text");
  }

  // --- 2. Filter panel: dropdowns only, ignores the text bar and the map. ---
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

  // --- 3. Map panel: the selected site only, ignores the text bar and filters. ---
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
    if (!window.confirm("Delete this artifact record? This cannot be undone.")) return;
    try {
      await api.del(`/items/${id}`);
      setResults((prev) => prev.filter((item) => item._id !== id));
      api.get("/search/map").then((data) => setSites(data.sites));
    } catch (err) {
      alert(err.message || "This artifact could not be deleted.");
    }
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    setModalError("");

    if (!itemForm.discovery_date || !itemForm.discovery_date.trim()) {
      setModalError("Enter the date the artifact was recovered.");
      return;
    }
    if (!itemForm.location || !itemForm.location.trim()) {
      setModalError("Choose where the artifact is currently held.");
      return;
    }
    if (itemForm.latitude === "" || itemForm.longitude === "") {
      setModalError("Set the find location by clicking on the map.");
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
      // Reload whichever search mode is active; never merge two of them.
      if (searchMode === "artifact") {
        runQuery({ id: searchParams.get("id") }, "artifact");
      } else if (searchMode === "filters") {
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Public record</span>
          <h1>Artifact catalogue</h1>
          <p className="page-subtitle">
            Search the national record by name, civilization, era, region, material, use, or where
            an object was found.
          </p>
        </div>
        {user?.role === "archaeologist" && (
          <button
            className="btn"
            onClick={() => {
              setEditingItem(null);
              setItemForm({
                name: "", picture: "", description: "", discovery_date: "", location: "",
                civilization: "", era: "", region: "", material: "", usage: "",
                latitude: "", longitude: "", site_name: "",
              });
              setShowModal(true);
              setModalError("");
            }}
          >
            <Plus size={16} aria-hidden="true" /> Add artifact
          </button>
        )}
      </div>

      {!user && (
        <div className="alert alert-info">
          <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            You are browsing as a guest, so descriptions are abridged and provenance details are
            withheld. <Link to="/register">Register</Link> or <Link to="/login">sign in</Link> for
            the full record.
          </span>
        </div>
      )}

      {/* 1. Always-visible keyword search */}
      <form className="home-search-row" onSubmit={handleTextSearch}>
        <label className="home-search-field">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, description, site, civilization, or era"
            aria-label="Search the artifact catalogue"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      {/* Panels are closed by default; opening one does not run a search. */}
      <div className="toolbar">
        <button
          className={panelOpen === "filters" ? "btn" : "btn btn-secondary"}
          aria-expanded={panelOpen === "filters"}
          onClick={() => togglePanel("filters")}
        >
          <LayoutGrid size={15} aria-hidden="true" /> Refine by attribute
        </button>
        <button
          className={panelOpen === "map" ? "btn" : "btn btn-secondary"}
          aria-expanded={panelOpen === "map"}
          onClick={() => togglePanel("map")}
        >
          <MapPin size={15} aria-hidden="true" /> Search by location
        </button>
      </div>

      {panelOpen === "filters" && (
        <div className="panel">
          <div className="panel-head">
            <h3>Refine by attribute</h3>
            <button className="icon-btn" onClick={() => togglePanel("filters")} aria-label="Close panel">
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="panel-body">
            <div className="form">
              <div className="form-row">
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
                  <label key={field}>
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

              <div className="actions">
                <button className="btn" onClick={applyFilters}>
                  <Search size={15} aria-hidden="true" /> Apply filters
                </button>
                <button className="btn btn-secondary" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {panelOpen === "map" && (
        <div className="panel">
          <div className="panel-head">
            <h3>Search by find location</h3>
            <button className="icon-btn" onClick={() => togglePanel("map")} aria-label="Close panel">
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="panel-body">
            <p className="hint" style={{ marginTop: 0 }}>
              Search a place to centre the map, or select a recorded site directly. Results cover
              roughly a 50 km radius.
            </p>

            <div className="home-search-row" style={{ marginBottom: "0.9rem" }}>
              <label className="home-search-field">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="e.g. Mahasthangarh, Bogura"
                  aria-label="Search for a place"
                />
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleMapLocationSearch}
                disabled={mapSearchBusy}
              >
                {mapSearchBusy ? "Searching" : "Find place"}
              </button>
            </div>

            {mapSearchResults.length > 0 && (
              <ul className="map-results" style={{ margin: "0 0 0.9rem" }}>
                {mapSearchResults.map((result) => (
                  <li
                    key={result.place_id || `${result.lat}-${result.lon}`}
                    onClick={() => selectMapSearchResult(result)}
                  >
                    {result.display_name}
                  </li>
                ))}
              </ul>
            )}

            {mapSearchError && <div className="alert alert-danger">{mapSearchError}</div>}

            <ArtifactResultsMap
              sites={sites}
              selectedSiteId={selectedSite?._id}
              onSelectSite={handleSelectSite}
              searchLocation={mapSearchLocation}
            />

            {(selectedSite || mapSearchLocation) && (
              <p className="hint" style={{ margin: "0.9rem 0 0" }}>
                {selectedSite ? (
                  <>
                    Showing artifacts recovered from <strong>{selectedSite.name}</strong>.
                  </>
                ) : (
                  <>
                    Showing artifacts within 50 km of <strong>{mapSearchLocation.label}</strong>.
                  </>
                )}{" "}
                <button
                  className="btn-link"
                  onClick={() => {
                    clearSiteFilter();
                    setMapSearchLocation(null);
                    setMapSearchQuery("");
                    setMapSearchError("");
                    setMapSearchResults([]);
                  }}
                >
                  Clear
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {searchMode === "artifact" && (
        <div className="alert alert-info">
          <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Showing a single catalogue record.{" "}
            <button className="btn-link" onClick={() => setSearchParams({})}>
              Browse the whole catalogue
            </button>
          </span>
        </div>
      )}

      <div className="section-head">
        <h2>Results</h2>
        <span className="hint">
          {loading ? "Searching" : `${results.length} artifact${results.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading && results.length === 0 ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Searching the catalogue
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <PackageSearch size={26} aria-hidden="true" />
          <h3>No matching artifacts</h3>
          <p>
            Nothing in the catalogue matches this search. Try a broader keyword, or clear the
            attribute filters.
          </p>
        </div>
      ) : (
        <div className="artifact-cards">
          {results.map((item) => (
            <article key={item._id} className="artifact-card">
              {item.picture && (
                <img
                  className="artifact-card-image"
                  src={item.picture}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="artifact-card-body">
                <h4>{item.name}</h4>
                <p className="artifact-tile-class">
                  {item.Type}
                  {item.site_name ? ` · ${item.site_name}` : ""}
                </p>
                <p className="artifact-card-desc">{item.description || "No description recorded."}</p>

                <dl className="artifact-tile-facts">
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
                  {!item.limited && (
                    <>
                      {item.discovery_date && (
                        <div>
                          <dt>Recovered</dt>
                          <dd>{item.discovery_date.slice(0, 10)}</dd>
                        </div>
                      )}
                      {item.location && (
                        <div>
                          <dt>Held at</dt>
                          <dd>{item.location}</dd>
                        </div>
                      )}
                      {item.district && (
                        <div>
                          <dt>Find spot</dt>
                          <dd>
                            {item.thana ? `${item.thana}, ` : ""}
                            {item.district}
                          </dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>

                {item.limited && (
                  <p className="artifact-card-locked">
                    <Lock size={12} aria-hidden="true" /> Sign in for the recovery date, find spot,
                    and full description.
                  </p>
                )}

                {(user?.role === "admin" ||
                  (user?.role === "museum_manager" &&
                    item.allocation === "Museum" &&
                    (item.museumName === user?.museum_name || item.location === user?.museum_name))) && (
                  <div className="actions" style={{ marginTop: "0.9rem" }}>
                    <button
                      className="btn-small btn-secondary"
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
                          site_name: item.site_name || "",
                        });
                        setModalError("");
                        setShowModal(true);
                      }}
                    >
                      <Edit size={13} aria-hidden="true" /> Edit
                    </button>
                    {user?.role === "admin" && (
                      <button className="btn-small btn-danger" onClick={() => handleDeleteItem(item._id)}>
                        <Trash2 size={13} aria-hidden="true" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Catalogue record</span>
                <h2>{editingItem ? "Edit artifact record" : "Add an artifact"}</h2>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={handleModalSubmit} className="form">
              <label>
                Artifact name
                <input
                  value={itemForm.name}
                  onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Terracotta votive plaque"
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={itemForm.description}
                  onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Condition, dimensions, decoration, and context"
                />
              </label>
              <label>
                Date recovered
                <input
                  type="date"
                  value={itemForm.discovery_date}
                  onChange={(e) => setItemForm((f) => ({ ...f, discovery_date: e.target.value }))}
                  required
                />
              </label>

              <ArtifactImagePicker
                value={itemForm.picture}
                onChange={(v) => setItemForm((f) => ({ ...f, picture: v }))}
              />

              <div className="form-row">
                <label>Civilization <input value={itemForm.civilization} onChange={(e) => setItemForm((f) => ({ ...f, civilization: e.target.value }))} /></label>
                <label>Era <input value={itemForm.era} onChange={(e) => setItemForm((f) => ({ ...f, era: e.target.value }))} /></label>
                <label>Region <input value={itemForm.region} onChange={(e) => setItemForm((f) => ({ ...f, region: e.target.value }))} /></label>
                <label>Material <input value={itemForm.material} onChange={(e) => setItemForm((f) => ({ ...f, material: e.target.value }))} /></label>
                <label>Use <input value={itemForm.usage} onChange={(e) => setItemForm((f) => ({ ...f, usage: e.target.value }))} /></label>
                <label>
                  Currently held at
                  <SearchableSelect
                    options={[DEFAULT_LOCATION, ...MUSEUMS]}
                    value={itemForm.location}
                    onChange={(v) => setItemForm((f) => ({ ...f, location: v }))}
                    placeholder="Museum or government repository"
                    required
                  />
                </label>
              </div>

              <fieldset>
                <legend>Find location</legend>
                <p className="hint" style={{ margin: 0 }}>
                  {editingItem
                    ? "Click the map or drag the marker to correct where this artifact was recovered."
                    : "Click the map or drag the marker to set where this artifact was recovered."}
                </p>
                <GoogleMapPicker
                  value={
                    itemForm.latitude !== "" && itemForm.longitude !== ""
                      ? { lat: parseFloat(itemForm.latitude), lng: parseFloat(itemForm.longitude) }
                      : null
                  }
                  onChange={({ lat, lng, address }) =>
                    setItemForm((f) => ({ ...f, latitude: lat, longitude: lng, site_name: address || f.site_name }))
                  }
                  height={280}
                />
              </fieldset>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={modalBusy}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={modalBusy}>
                  {modalBusy ? "Saving" : editingItem ? "Save changes" : "Add to catalogue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
