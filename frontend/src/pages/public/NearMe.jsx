import { useState } from "react";
import { Link } from "react-router-dom";
import { LocateFixed, MapPin, CalendarDays, Landmark, Ticket, Clock } from "lucide-react";
import { api } from "../../api";
import NearMeMap from "../../components/NearMeMap";

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function NearMe() {
  const [center, setCenter] = useState(null);
  const [sites, setSites] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [museums, setMuseums] = useState([]);
  const [radius, setRadius] = useState(50);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  function findNearMe(radiusKm = radius) {
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
          setCenter({ lat: latitude, lng: longitude });
          const data = await api.get(`/near-me?lat=${latitude}&lng=${longitude}&radius_km=${radiusKm}`);
          setSites(data.sites || []);
          setExhibitions(data.exhibitions || []);
          setMuseums(data.museums || []);
        } catch (err) {
          setError(err.message || "Nearby records could not be loaded.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Location access was declined. Enable it in your browser and try again.");
        setLocating(false);
      }
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Location search</span>
          <h1>Sites near you</h1>
          <p className="page-subtitle">
            Recorded excavation sites, museums, and public events within reach of your current
            location.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--primary-dark)" }}>
          Search radius
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{ width: "auto" }}
          >
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
            <option value={250}>250 km</option>
          </select>
        </label>
        <button className="btn" onClick={() => findNearMe(radius)} disabled={locating}>
          <LocateFixed size={16} aria-hidden="true" />{" "}
          {locating ? "Locating" : center ? "Search again" : "Use my location"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!center && !error && (
        <div className="empty-state">
          <LocateFixed size={26} aria-hidden="true" />
          <h3>Share your location to begin</h3>
          <p>
            Your location is used once, in your browser, to work out what is nearby. It is never
            stored on the register.
          </p>
        </div>
      )}

      {center && (
        <>
          <div className="panel">
            <div className="panel-body">
              <NearMeMap center={center} sites={sites} exhibitions={exhibitions} museums={museums} />
            </div>
          </div>

          <div className="section-head">
            <h2>
              <Landmark size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
              Excavation sites
            </h2>
            <span className="hint">{sites.length} within {radius} km</span>
          </div>
          {sites.length === 0 ? (
            <p className="hint">No recorded sites within {radius} km.</p>
          ) : (
            <ul className="record-list">
              {sites.map((s) => (
                <li className="record-row" key={s._id}>
                  <div className="record-main">
                    <h4>{s.name}</h4>
                    <p className="meta-row">
                      {s.era && <span>{s.era}</span>}
                      <span>{[s.thana, s.district].filter(Boolean).join(", ")}</span>
                    </p>
                  </div>
                  <div className="record-side">
                    <span className="chip">{s.artifact_count} artifacts</span>
                    <span className="hint">{s.distance_km.toFixed(1)} km away</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="section-head">
            <h2>
              <CalendarDays size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
              Exhibitions &amp; events
            </h2>
            <span className="hint">{exhibitions.length} within {radius} km</span>
          </div>
          {exhibitions.length === 0 ? (
            <p className="hint">No upcoming events within {radius} km.</p>
          ) : (
            <ul className="record-list">
              {exhibitions.map((e) => (
                <li className="record-row" key={e._id}>
                  <div className="record-main">
                    <h4>{e.title}</h4>
                    <p className="meta-row">
                      {e.museum_name && <span>{e.museum_name}</span>}
                      <span>
                        <CalendarDays size={13} aria-hidden="true" /> {fmtDate(e.start_date)} —{" "}
                        {fmtDate(e.end_date)}
                      </span>
                      {e.location?.address && (
                        <span>
                          <MapPin size={13} aria-hidden="true" /> {e.location.address}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="record-side">
                    <span className="hint">{e.distance_km.toFixed(1)} km away</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="section-head">
            <h2>
              <Landmark size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
              Museums
            </h2>
            <span className="hint">{museums.length} within {radius} km</span>
          </div>
          {museums.length === 0 ? (
            <p className="hint">No museums with a registered location within {radius} km.</p>
          ) : (
            <ul className="record-list">
              {museums.map((m) => (
                <li className="record-row" key={m.museum_name}>
                  <div className="record-main">
                    <h4>{m.museum_name}</h4>
                    <p className="meta-row">
                      {m.address && (
                        <span>
                          <MapPin size={13} aria-hidden="true" /> {m.address}
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
                  </div>
                  <div className="record-side">
                    <span className="hint">
                      {m.artifact_count} on record · {m.distance_km.toFixed(1)} km away
                    </span>
                    <Link
                      to={`/museums/${encodeURIComponent(m.museum_name)}`}
                      className="btn-small btn-secondary"
                    >
                      View collection
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}