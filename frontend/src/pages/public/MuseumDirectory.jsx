import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Ticket, Clock, LocateFixed, Search, Landmark } from "lucide-react";
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
      setError(err.message || "The museum directory could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function useNearMe() {
    if (!navigator.geolocation) {
      setError("This browser does not support location services.");
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
          setError(err.message || "Nearby museums could not be loaded.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Location access was declined, so the full directory is shown instead.");
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Public record</span>
          <h1>Museum directory</h1>
          <p className="page-subtitle">
            Every participating museum, with visitor information and what each holds on display, in
            storage, or on loan.
          </p>
        </div>
        {nearMeActive ? (
          <button className="btn btn-secondary" onClick={clearNearMe}>
            Show full directory
          </button>
        ) : (
          <button className="btn" onClick={useNearMe} disabled={locating}>
            <LocateFixed size={16} aria-hidden="true" /> {locating ? "Locating" : "Find near me"}
          </button>
        )}
      </div>

      <div className="home-search-row">
        <label className="home-search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by museum name"
            aria-label="Search the museum directory"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="section-head">
        <h2>{nearMeActive ? "Museums near you" : "All museums"}</h2>
        <span className="hint">
          {loading ? "Loading" : `${visible.length} listed`}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the directory
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <Landmark size={26} aria-hidden="true" />
          <h3>No museums found</h3>
          <p>No museum in the directory matches this search.</p>
        </div>
      ) : (
        <div className="listing-grid">
          {visible.map((m) => (
            <article key={m.museum_name} className="listing-card">
              <div className="listing-body">
                <h4 style={{ margin: "0 0 0.35rem" }}>{m.museum_name}</h4>

                <p className="meta-row" style={{ marginTop: 0 }}>
                  {m.address && (
                    <span>
                      <MapPin size={13} aria-hidden="true" /> {m.address}
                      {m.distance_km != null && ` · ${m.distance_km.toFixed(1)} km away`}
                    </span>
                  )}
                  {m.operating_hours && (
                    <span>
                      <Clock size={13} aria-hidden="true" /> {m.operating_hours}
                    </span>
                  )}
                  {m.ticket_info && (
                    <span>
                      <Ticket size={13} aria-hidden="true" /> {m.ticket_info}
                    </span>
                  )}
                </p>

                <dl className="artifact-tile-facts" style={{ marginTop: "0.9rem" }}>
                  <div>
                    <dt>On display</dt>
                    <dd className="num">{m.artifact_counts["On Display"]}</dd>
                  </div>
                  <div>
                    <dt>In storage</dt>
                    <dd className="num">{m.artifact_counts["In Storage"]}</dd>
                  </div>
                  <div>
                    <dt>Under conservation</dt>
                    <dd className="num">{m.artifact_counts["Under Conservation"]}</dd>
                  </div>
                  <div>
                    <dt>On loan</dt>
                    <dd className="num">{m.artifact_counts["On Loan"]}</dd>
                  </div>
                </dl>

                <Link
                  to={`/museums/${encodeURIComponent(m.museum_name)}`}
                  className="btn btn-small btn-secondary"
                  style={{ marginTop: "1rem" }}
                >
                  View collection ({m.artifact_counts.total})
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}