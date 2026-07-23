import { useEffect, useState } from "react";
import { CalendarDays, MapPin, LocateFixed, Ticket, Phone } from "lucide-react";
import { api } from "../../api";

const TYPE_LABELS = {
  exhibition: "Exhibition",
  educational_tour: "Educational Tour",
  cultural_event: "Cultural Event",
};

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function Exhibitions() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [nearMeActive, setNearMeActive] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/exhibitions?upcoming=true");
      setExhibitions(data.exhibitions);
    } catch (err) {
      setError(err.message || "Could not load exhibitions.");
    } finally {
      setLoading(false);
    }
  }

  function useNearMe() {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location services.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await api.get(`/exhibitions/nearby?lat=${latitude}&lng=${longitude}&radius_km=50`);
          setExhibitions(data.exhibitions);
          setNearMeActive(true);
        } catch (err) {
          setLocationError(err.message || "Could not load nearby exhibitions.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError("Location permission denied. Showing all upcoming listings instead.");
        setLocating(false);
      }
    );
  }

  function clearNearMe() {
    setNearMeActive(false);
    setLocationError("");
    loadAll();
  }

  const visible = typeFilter ? exhibitions.filter((e) => e.type === typeFilter) : exhibitions;

  return (
    <div className="page">
      <h1>Exhibitions, Tours & Events</h1>
      <p className="page-subtitle">
        Discover museum exhibitions, educational tours, and cultural events published by museums near you.
      </p>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className={typeFilter === "" ? "btn" : "btn-small"} onClick={() => setTypeFilter("")}>
            All
          </button>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={typeFilter === value ? "btn" : "btn-small"}
              onClick={() => setTypeFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {nearMeActive ? (
            <button className="btn-small btn-outline" onClick={clearNearMe}>
              Clear "Near Me"
            </button>
          ) : (
            <button className="btn" onClick={useNearMe} disabled={locating}>
              <LocateFixed size={15} /> {locating ? "Locating..." : "Near Me"}
            </button>
          )}
        </div>
      </div>

      {locationError && <div className="alert alert-info">{locationError}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <h3>{loading ? "Loading..." : `${visible.length} upcoming listing(s)${nearMeActive ? " near you" : ""}`}</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {visible.map((item) => (
          <div key={item._id} className="card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
              />
            )}
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
              {TYPE_LABELS[item.type] || item.type}
            </span>
            <h4 style={{ margin: 0 }}>{item.title}</h4>
            {item.museum_name && <p style={{ margin: 0, fontSize: "0.85rem", color: "#8a7a68" }}>{item.museum_name}</p>}
            <p style={{ margin: 0, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <CalendarDays size={14} /> {fmtDate(item.start_date)} - {fmtDate(item.end_date)}
              {item.start_time && ` · ${item.start_time}${item.end_time ? ` - ${item.end_time}` : ""}`}
            </p>
            {item.location?.address && (
              <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "#777" }}>
                <MapPin size={14} /> {item.location.address}
                {item.distance_km != null && ` · ${item.distance_km.toFixed(1)} km away`}
              </p>
            )}
            {item.description && <p style={{ margin: 0, fontSize: "0.88rem" }}>{item.description}</p>}
            {item.ticket_info && (
              <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Ticket size={14} /> {item.ticket_info}
              </p>
            )}
            {item.contact && (
              <p style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Phone size={14} /> {item.contact}
              </p>
            )}
          </div>
        ))}
        {!loading && visible.length === 0 && <p>No upcoming listings match this view yet.</p>}
      </div>
    </div>
  );
}