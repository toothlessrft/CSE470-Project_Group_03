import { useEffect, useState } from "react";
import { Search, MapPin, LayoutGrid, X } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import ArtifactResultsMap from "../../components/ArtifactResultsMap";

const FIELD_LABELS = {
  civilization: "Civilization",
  era: "Era",
  region: "Region",
  material: "Material",
  usage: "Usage",
};

export default function ArtifactSearch() {
  const { user } = useAuth();

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ civilization: "", era: "", region: "", material: "", usage: "" });
  const [options, setOptions] = useState({ civilizations: [], eras: [], regions: [], materials: [], usages: [] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Which panel (if any) is expanded. Independent of what's actually driving
  // the current results - opening a panel does not run a search by itself.
  const [panelOpen, setPanelOpen] = useState(null); // null | "filters" | "map"

  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    api.get("/search/filters").then(setOptions);
    api.get("/search/map").then((data) => setSites(data.sites));
    runQuery({}); // show everything on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runQuery(params) {
    setLoading(true);
    try {
      const usp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v != null && v !== "" && usp.set(k, v));
      const data = await api.get(`/search/artifacts?${usp.toString()}`);
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  }

  // --- 1. Text bar: searches name/description/site/civilization/etc, ignores filters + map selection ---
  function handleTextSearch(e) {
    e.preventDefault();
    setSelectedSite(null);
    runQuery({ q });
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
    runQuery({ ...filters });
  }

  function clearFilters() {
    setFilters({ civilization: "", era: "", region: "", material: "", usage: "" });
    runQuery({});
  }

  // --- 3. Map panel: uses only the selected site, ignores the text bar + filters ---
  function handleSelectSite(site) {
    setSelectedSite(site);
    runQuery({ site: site._id });
  }

  function clearSiteFilter() {
    setSelectedSite(null);
    runQuery({});
  }

  return (
    <div className="page">
      <h1>Smart Artifact Search</h1>
      <p className="page-subtitle">
        Explore the artifact catalogue by civilization, era, region, material, usage, or discovery location.
      </p>

      {!user && (
        <div className="alert alert-success">
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
      <div className="link-grid" style={{ marginBottom: "1rem" }}>
        <button className={panelOpen === "filters" ? "btn" : "btn-small"} onClick={() => togglePanel("filters")}>
          <LayoutGrid size={15} /> Filter Search
        </button>
        <button className={panelOpen === "map" ? "btn" : "btn-small"} onClick={() => togglePanel("map")}>
          <MapPin size={15} /> Search by Location
        </button>
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
                <select value={filters[field]} onChange={(e) => handleFilterChange(field, e.target.value)}>
                  <option value="">Any</option>
                  {options[`${field}s`]?.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
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
            Click a pin to see artifacts discovered at that heritage site.
          </p>
          <ArtifactResultsMap sites={sites} selectedSiteId={selectedSite?._id} onSelectSite={handleSelectSite} />
          {selectedSite && (
            <p style={{ marginTop: "0.75rem" }}>
              Showing artifacts from <strong>{selectedSite.name}</strong>.{" "}
              <button className="btn-link" onClick={clearSiteFilter}>
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
                {item.district && <>Location: {item.thana ? `${item.thana}, ` : ""}{item.district}</>}
              </p>
            )}
          </div>
        ))}
        {!loading && results.length === 0 && <p>No artifacts match this search yet.</p>}
      </div>
    </div>
  );
}
