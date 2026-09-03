import { useEffect, useState } from "react";
import { CalendarDays, MapPin, LocateFixed, Ticket, Phone, CalendarX } from "lucide-react";
import { api } from "../../api";

const TYPE_LABELS = {
  exhibition: "Exhibition",
  educational_tour: "Educational tour",
  cultural_event: "Cultural event",
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
      setError(err.message || "Listings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function useNearMe() {
    if (!navigator.geolocation) {
      setLocationError("This browser does not support location services.");
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
          setLocationError(err.message || "Nearby listings could not be loaded.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError("Location access was declined, so all upcoming listings are shown instead.");
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Public programme</span>
          <h1>Exhibitions & events</h1>
          <p className="page-subtitle">
            Exhibitions, educational tours, and cultural events published by museums across the
            register.
          </p>
        </div>
        {nearMeActive ? (
          <button className="btn btn-secondary" onClick={clearNearMe}>
            Show all listings
          </button>
        ) : (
          <button className="btn" onClick={useNearMe} disabled={locating}>
            <LocateFixed size={16} aria-hidden="true" /> {locating ? "Locating" : "Find near me"}
          </button>
        )}
      </div>

      <div className="toolbar">
        <button
          className={typeFilter === "" ? "btn btn-small" : "btn btn-small btn-secondary"}
          aria-pressed={typeFilter === ""}
          onClick={() => setTypeFilter("")}
        >
          All listings
        </button>
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <button
            key={value}
            className={typeFilter === value ? "btn btn-small" : "btn btn-small btn-secondary"}
            aria-pressed={typeFilter === value}
            onClick={() => setTypeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {locationError && <div className="alert alert-info">{locationError}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="section-head">
        <h2>{nearMeActive ? "Near you" : "Upcoming"}</h2>
        <span className="hint">
          {loading ? "Loading" : `${visible.length} listing${visible.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading listings
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <CalendarX size={26} aria-hidden="true" />
          <h3>Nothing scheduled</h3>
          <p>
            No upcoming listings match this view. Try another category, or clear the location
            filter.
          </p>
        </div>
      ) : (
        <div className="listing-grid">
          {visible.map((item) => (
            <article key={item._id} className="listing-card">
              {item.image && <img className="listing-image" src={item.image} alt="" loading="lazy" />}
              <div className="listing-body">
                <p className="artifact-tile-class">{TYPE_LABELS[item.type] || item.type}</p>
                <h4 style={{ margin: "0 0 0.15rem" }}>{item.title}</h4>
                {item.museum_name && <p className="record-meta">{item.museum_name}</p>}

                <p className="meta-row">
                  <span>
                    <CalendarDays size={13} aria-hidden="true" /> {fmtDate(item.start_date)} —{" "}
                    {fmtDate(item.end_date)}
                    {item.start_time && ` · ${item.start_time}${item.end_time ? `–${item.end_time}` : ""}`}
                  </span>
                  {item.location?.address && (
                    <span>
                      <MapPin size={13} aria-hidden="true" /> {item.location.address}
                      {item.distance_km != null && ` · ${item.distance_km.toFixed(1)} km away`}
                    </span>
                  )}
                </p>

                {item.description && (
                  <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", lineHeight: 1.55 }}>
                    {item.description}
                  </p>
                )}

                {(item.ticket_info || item.contact) && (
                  <p className="meta-row" style={{ marginTop: "0.75rem" }}>
                    {item.ticket_info && (
                      <span>
                        <Ticket size={13} aria-hidden="true" /> {item.ticket_info}
                      </span>
                    )}
                    {item.contact && (
                      <span>
                        <Phone size={13} aria-hidden="true" /> {item.contact}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}