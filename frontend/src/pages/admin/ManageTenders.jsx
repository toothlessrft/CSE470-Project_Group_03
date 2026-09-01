// Ahad_23201016 - Tender Publication & Management (Government): tender list.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Banknote, CalendarClock, Users, MapPin } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const TABS = ["All", "Open", "Awarded", "Cancelled"];

const STATUS_COLORS = {
  Open: "#1d4ed8",
  Awarded: "#1f6b2e",
  Cancelled: "#b02020",
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Procurement</span>
          <h1>Excavation tenders</h1>
          <p className="page-subtitle">
            Publish excavation contracts, evaluate submitted bids, and award the work to a licensed
            contractor.
          </p>
        </div>
        <Link to="/admin/tenders/new" className="btn">
          <Plus size={16} aria-hidden="true" /> Publish tender
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "tab-active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading tenders
        </div>
      ) : tenders.length === 0 ? (
        <div className="empty-state">
          <FileText size={26} aria-hidden="true" />
          <h3>No tenders here</h3>
          <p>
            There are no {tab !== "All" ? tab.toLowerCase() : ""} tenders. Publish one from an
            approved field report to invite bids.
          </p>
          <Link className="btn" to="/admin/tenders/new">
            Publish tender
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tenders.map((t) => (
            <div
              key={t._id}
              className="card"
              style={{
                margin: 0,
                borderLeft: `3px solid ${STATUS_COLORS[t.status] || "var(--border-strong)"}`,
              }}
            >
              <div className="report-header">
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 0.2rem" }}>{t.title}</h3>
                  <p className="meta-row">
                    <span>
                      <MapPin size={13} aria-hidden="true" />{" "}
                      {t.location?.address || "No location recorded"}
                    </span>
                    {t.archaeologist && <span>Lead: {t.archaeologist.name}</span>}
                  </p>
                </div>
                <StatusBadge status={t.status === "Open" ? "Active" : t.status} />
              </div>

              <dl className="detail-list" style={{ margin: "1.1rem 0" }}>
                <div>
                  <dt>
                    <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Estimated budget
                  </dt>
                  <dd className="num">৳{t.estimated_budget?.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>
                    <CalendarClock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Bids close
                  </dt>
                  <dd className="num">{new Date(t.deadline).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt>
                    <Users size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Bids received
                  </dt>
                  <dd className="num">{t.bid_count}</dd>
                </div>
              </dl>

              {t.status === "Awarded" && t.awarded_team && (
                <div className="alert alert-success">
                  <span>
                    Awarded to <strong>{t.awarded_team.company_name}</strong>, represented by{" "}
                    {t.awarded_team.representative}.
                  </span>
                </div>
              )}
              {t.status === "Cancelled" && t.cancel_reason && (
                <div className="alert alert-danger">{t.cancel_reason}</div>
              )}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <Link
                  className={t.status === "Open" ? "btn-small" : "btn-small btn-secondary"}
                  to={`/admin/tenders/${t._id}`}
                >
                  {t.status === "Open" ? "Evaluate bids" : "Open tender"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
