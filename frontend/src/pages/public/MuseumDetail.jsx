import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Ticket, Clock, ArrowLeft } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const FILTERS = ["", "On Display", "In Storage", "Under Conservation", "On Loan", "Transferred"];

export default function MuseumDetail() {
  const { museumName } = useParams();
  const [museum, setMuseum] = useState(null);
  const [items, setItems] = useState([]);
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [museumName, availability]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = availability ? `?availability=${encodeURIComponent(availability)}` : "";
      const data = await api.get(`/museums/${encodeURIComponent(museumName)}${qs}`);
      setMuseum(data.museum);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Could not load this museum.");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !museum) return <div className="page">Loading...</div>;
  if (error && !museum) return <div className="page"><div className="alert alert-danger">{error}</div></div>;

  return (
    <div className="page">
      <Link to="/museums" className="btn-small btn-outline-light" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "1rem" }}>
        <ArrowLeft size={14} /> Back to directory
      </Link>

      <h1>{museum.museum_name}</h1>
      {museum.address && (
        <p style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#777" }}>
          <MapPin size={15} /> {museum.address}
        </p>
      )}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {museum.operating_hours && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Clock size={15} /> {museum.operating_hours}</span>
        )}
        {museum.ticket_info && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Ticket size={15} /> {museum.ticket_info}</span>
        )}
      </div>

      <div className="card" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button key={f || "all"} className={availability === f ? "btn" : "btn-small"} onClick={() => setAvailability(f)}>
            {f || "All"}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <h3>{loading ? "Loading..." : `${items.length} artifact(s)`}</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {items.map((item) => (
          <div key={item._id} className="card" style={{ margin: 0 }}>
            {item.picture && (
              <img src={item.picture} alt={item.name} style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "0.4rem" }}>
              <h4 style={{ margin: 0 }}>{item.name}</h4>
              <StatusBadge status={item.availability} />
            </div>
            <p className="hint" style={{ margin: "0.25rem 0" }}>{item.Type} &middot; ID: {item.artifactId || "—"}</p>
            {item.description && <p style={{ margin: 0, fontSize: "0.85rem" }}>{item.description}</p>}
            {item.location && <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "#777" }}>Location: {item.location}</p>}
          </div>
        ))}
        {!loading && items.length === 0 && <p>No artifacts match this filter.</p>}
      </div>
    </div>
  );
}