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
      setError("Your browser doesn't support location services.");
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
          setError(err.message || "Could not load nearby places.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Location permission denied. Enable location access and try again.");
        setLocating(false);
      }
    );
  }

  return (
    <div className="page">
      <h1>Near Me</h1>
      <p className="page-subtitle">
        Find archaeological sites, exhibitions and events, and museums close to your current location.
      </p>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Radius
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
            <option value={250}>250 km</option>
          </select>
        </label>
        <button className="btn" onClick={() => findNearMe(radius)} disabled={locating}>
          <LocateFixed size={15} /> {locating ? "Locating..." : center ? "Refresh" : "Use my location"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {center && (
        <>
          <div className="card">
            <NearMeMap center={center} sites={sites} exhibitions={exhibitions} museums={museums} />
          </div>

          <h3><Landmark size={16} /> Archaeological sites ({sites.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {sites.map((s) => (
              <div key={s._id} className="card" style={{ margin: 0 }}>
                <h4 style={{ margin: 0 }}>{s.name}</h4>
                <p className="hint" style={{ margin: "0.25rem 0" }}>{s.era}</p>
                <p style={{ margin: 0, fontSize: "0.85rem" }}>
                  {[s.thana, s.district].filter(Boolean).join(", ")}
                </p>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#777" }}>
                  {s.artifact_count} artifact(s) &middot; {s.distance_km.toFixed(1)} km away
                </p>
              </div>
            ))}
            {sites.length === 0 && <p>No archaeological sites within {radius} km.</p>}
          </div>

          <h3 style={{ marginTop: "1.5rem" }}><CalendarDays size={16} /> Exhibitions &amp; events ({exhibitions.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {exhibitions.map((e) => (
              <div key={e._id} className="card" style={{ margin: 0 }}>
                <h4 style={{ margin: 0 }}>{e.title}</h4>
                {e.museum_name && <p className="hint" style={{ margin: "0.25rem 0" }}>{e.museum_name}</p>}
                <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <CalendarDays size={13} /> {fmtDate(e.start_date)} - {fmtDate(e.end_date)}
                </p>
                {e.location?.address && (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "#777" }}>
                    <MapPin size={13} /> {e.location.address} &middot; {e.distance_km.toFixed(1)} km away
                  </p>
                )}
              </div>
            ))}
            {exhibitions.length === 0 && <p>No upcoming exhibitions or events within {radius} km.</p>}
          </div>

          <h3 style={{ marginTop: "1.5rem" }}><Landmark size={16} /> Museums ({museums.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {museums.map((m) => (
              <div key={m.museum_name} className="card" style={{ margin: 0 }}>
                <h4 style={{ margin: 0 }}>{m.museum_name}</h4>
                {m.address && <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}><MapPin size={13} /> {m.address}</p>}
                {m.operating_hours && (
                  <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Clock size={13} /> {m.operating_hours}
                  </p>
                )}
                {m.ticket_info && (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Ticket size={13} /> {m.ticket_info}
                  </p>
                )}
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#777" }}>
                  {m.artifact_count} artifact(s) on record &middot; {m.distance_km.toFixed(1)} km away
                </p>
                <Link to={`/museums/${encodeURIComponent(m.museum_name)}`} className="btn-small btn-outline-light" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                </Link>
              </div>
            ))}
            {museums.length === 0 && <p>No museums with a registered location within {radius} km.</p>}
          </div>
        </>
      )}
    </div>
  );
}