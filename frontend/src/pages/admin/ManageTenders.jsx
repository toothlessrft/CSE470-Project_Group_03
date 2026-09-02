// Ahad_23201016 - Tender Publication & Management (Government): tender list.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Banknote, CalendarClock, Users, MapPin } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const TABS = ["All", "Open", "Awarded", "Cancelled"];

const STATUS_COLORS = {
  Open: "#2563eb",
  Awarded: "#2e7d32",
  Cancelled: "#c62828",
};

export default function ManageTenders() {
  const [tab, setTab] = useState("All");
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const query = tab === "All" ? "" : `?status=${tab}`;
    api
      .get(`/tenders/admin${query}`)
      .then((data) => setTenders(data.tenders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1>Excavation Tenders</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Publish excavation contracts, review submitted bids, and assign the winning excavation
            team.
          </p>
        </div>
        <Link to="/admin/tenders/new" className="btn">
          <Plus size={15} /> New Tender
        </Link>
      </div>

      {error && <div className="alert alert-danger" style={{ marginTop: "1rem" }}>{error}</div>}

      <div className="tabs" style={{ marginTop: "1.5rem" }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "tab-active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="hint">Loading tenders...</p>
      ) : tenders.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          <FileText size={28} style={{ marginBottom: "0.5rem" }} />
          <p style={{ margin: 0 }}>
            No {tab !== "All" ? tab.toLowerCase() : ""} tenders yet.{" "}
            <Link to="/admin/tenders/new">Publish one</Link> from an approved field report.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tenders.map((t) => (
            <div
              key={t._id}
              className="card"
              style={{
                margin: 0,
                borderLeft: `4px solid ${STATUS_COLORS[t.status] || "var(--border)"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>{t.title}</h3>
                  <p className="hint" style={{ margin: 0 }}>
                    <MapPin size={13} style={{ verticalAlign: "middle" }} />{" "}
                    {t.location?.address || "No location recorded"}
                  </p>
                </div>
                <StatusBadge status={t.status === "Open" ? "Active" : t.status} />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  flexWrap: "wrap",
                  margin: "1rem 0",
                  fontSize: "0.88rem",
                  color: "var(--muted)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Banknote size={15} /> Est. ৳{t.estimated_budget?.toLocaleString()}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <CalendarClock size={15} /> Closes {new Date(t.deadline).toLocaleDateString()}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Users size={15} /> {t.bid_count} bid{t.bid_count === 1 ? "" : "s"}
                </span>
                {t.archaeologist && <span>Lead: {t.archaeologist.name}</span>}
              </div>

              {t.status === "Awarded" && t.awarded_team && (
                <div className="alert alert-success" style={{ marginBottom: "0.75rem" }}>
                  Awarded to <strong>{t.awarded_team.company_name}</strong> (rep.{" "}
                  {t.awarded_team.representative}).
                </div>
              )}
              {t.status === "Cancelled" && t.cancel_reason && (
                <div className="alert alert-danger" style={{ marginBottom: "0.75rem" }}>
                  {t.cancel_reason}
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <Link className="btn-small" to={`/admin/tenders/${t._id}`}>
                  {t.status === "Open" ? "View & Evaluate Bids" : "View Tender"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
