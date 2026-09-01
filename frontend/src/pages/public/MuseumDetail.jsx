import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Ticket, Clock, ArrowLeft, PackageSearch } from "lucide-react";
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
      setError(err.message || "This museum could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !museum)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the collection
        </div>
      </div>
    );
  if (error && !museum) return <div className="page"><div className="alert alert-danger">{error}</div></div>;

  return (
    <div className="page">
      <Link className="back-link" to="/museums">
        <ArrowLeft size={14} aria-hidden="true" /> Back to the directory
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Museum collection</span>
          <h1>{museum.museum_name}</h1>
          <p className="meta-row">
            {museum.address && (
              <span>
                <MapPin size={13} aria-hidden="true" /> {museum.address}
              </span>
            )}
            {museum.operating_hours && (
              <span>
                <Clock size={13} aria-hidden="true" /> {museum.operating_hours}
              </span>
            )}
            {museum.ticket_info && (
              <span>
                <Ticket size={13} aria-hidden="true" /> {museum.ticket_info}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="toolbar">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            className={availability === f ? "btn btn-small" : "btn btn-small btn-secondary"}
            aria-pressed={availability === f}
            onClick={() => setAvailability(f)}
          >
            {f || "All holdings"}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="section-head">
        <h2>Holdings</h2>
        <span className="hint">
          {loading ? "Loading" : `${items.length} artifact${items.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading holdings
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <PackageSearch size={26} aria-hidden="true" />
          <h3>Nothing to show</h3>
          <p>No artifacts in this collection match the selected status.</p>
        </div>
      ) : (
        <div className="artifact-cards">
          {items.map((item) => (
            <article key={item._id} className="artifact-card">
              {item.picture && (
                <img className="artifact-card-image" src={item.picture} alt={item.name} loading="lazy" />
              )}
              <div className="artifact-card-body">
                <div className="artifact-tile-head">
                  <strong>{item.name}</strong>
                  <StatusBadge status={item.availability} />
                </div>
                <p className="artifact-tile-class">
                  {item.Type} · accession {item.artifactId || "not assigned"}
                </p>
                {item.description && <p className="artifact-card-desc">{item.description}</p>}
                {item.location && (
                  <dl className="artifact-tile-facts">
                    <div>
                      <dt>Location</dt>
                      <dd>{item.location}</dd>
                    </div>
                  </dl>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}