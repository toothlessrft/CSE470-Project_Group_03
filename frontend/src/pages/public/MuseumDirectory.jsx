import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Ticket, Clock, LocateFixed } from "lucide-react";
import { api } from "../../api";

export default function MuseumDirectory() {
  const [museums, setMuseums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [nearMeActive, setNearMeActive] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/museums");
      setMuseums(data.museums || []);
    } catch (err) {
      setError(err.message || "Could not load the museum directory.");
    } finally {
      setLoading(false);
    }
  }

  function useNearMe() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location services.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await api.get(`/museums/nearby?lat=${latitude}&lng=${longitude}&radius_km=100`);
          setMuseums(data.museums || []);
          setNearMeActive(true);
        } catch (err) {
          setError(err.message || "Could not load nearby museums.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Location permission denied. Showing the full directory instead.");
        setLocating(false);
      }
    );
  }

  function clearNearMe() {
    setNearMeActive(false);
    loadAll();
  }

  const visible = museums.filter((m) => m.museum_name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page">
      <h1>Museum Directory</h1>
      <p className="page-subtitle">Browse museums, their locations, and what's currently on display, in storage, or on loan.</p>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search museums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        {nearMeActive ? (
          <button className="btn-small btn-outline-light" onClick={clearNearMe}>Clear "Near Me"</button>
        ) : (
          <button className="btn" onClick={useNearMe} disabled={locating}>
            <LocateFixed size={15} /> {locating ? "Locating..." : "Near Me"}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <h3>{loading ? "Loading..." : `${visible.length} museum(s)${nearMeActive ? " near you" : ""}`}</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {visible.map((m) => (
          <div key={m.museum_name} className="card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <h4 style={{ margin: 0 }}>{m.museum_name}</h4>
            {m.address && (
              <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "#777" }}>
                <MapPin size={13} /> {m.address}
                {m.distance_km != null && ` · ${m.distance_km.toFixed(1)} km away`}
              </p>
            )}
            {m.operating_hours && (
              <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Clock size={13} /> {m.operating_hours}
              </p>
            )}
            {m.ticket_info && (
              <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Ticket size={13} /> {m.ticket_info}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.78rem", marginTop: "0.25rem" }}>
              <span className="status-badge" style={{ backgroundColor: "#2e7d32" }}>On Display: {m.artifact_counts["On Display"]}</span>
              <span className="status-badge" style={{ backgroundColor: "#6b6258" }}>In Storage: {m.artifact_counts["In Storage"]}</span>
              <span className="status-badge" style={{ backgroundColor: "#d17d00" }}>Under Conservation: {m.artifact_counts["Under Conservation"]}</span>
              <span className="status-badge" style={{ backgroundColor: "#b5834d" }}>On Loan: {m.artifact_counts["On Loan"]}</span>
              <span className="status-badge" style={{ backgroundColor: "#5b6b8c" }}>Transferred: {m.artifact_counts["Transferred"]}</span>
            </div>
            <Link to={`/museums/${encodeURIComponent(m.museum_name)}`} className="btn-small" style={{ marginTop: "0.5rem", textAlign: "center" }}>
              View collection ({m.artifact_counts.total})
            </Link>
          </div>
        ))}
        {!loading && visible.length === 0 && <p>No museums match this view yet.</p>}
      </div>
    </div>
  );
}