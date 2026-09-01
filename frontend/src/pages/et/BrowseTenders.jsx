// Ahad_23201016 - Tender Bidding System (Excavation Team):
// browse available tenders and submit a bid (cost, timeline, proposal).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSearch,
  Banknote,
  CalendarClock,
  MapPin,
  Users,
  X,
  Gavel,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import StatusBadge from "../../components/StatusBadge";

function daysLeft(deadline) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`;
  const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)));
  return `${hours} hour${hours === 1 ? "" : "s"} left`;
}

export default function BrowseTenders() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bidding, setBidding] = useState(null); // tender being bid on
  const [form, setForm] = useState({ cost: "", timeline_days: "", proposal: "" });
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/tenders/open")
      .then((data) => setTenders(data.tenders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openBidForm(tender) {
    setBidding(tender);
    setModalError("");
    if (tender.my_bid && tender.my_bid.status !== "Withdrawn") {
      setForm({
        cost: tender.my_bid.cost,
        timeline_days: tender.my_bid.timeline_days,
        proposal: tender.my_bid.proposal,
      });
    } else {
      setForm({ cost: "", timeline_days: "", proposal: "" });
    }
  }

  async function submitBid(e) {
    e.preventDefault();
    setModalError("");
    setBusy(true);
    try {
      const existing = bidding.my_bid;
      if (existing && existing.status !== "Withdrawn") {
        await api.patch(`/tenders/bids/${existing._id}`, form);
        setSuccess("Your bid has been revised.");
      } else {
        await api.post(`/tenders/${bidding._id}/bids`, form);
        setSuccess("Bid submitted. You may revise or withdraw it until the closing date.");
      }
      setBidding(null);
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading open tenders
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Procurement</span>
          <h1>Open tenders</h1>
          <p className="page-subtitle">
            Excavation contracts published by the heritage authority. Submit your price, programme,
            and method statement; bids may be revised or withdrawn until the closing date.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {tenders.length === 0 ? (
        <div className="empty-state">
          <FileSearch size={26} aria-hidden="true" />
          <h3>No tenders open</h3>
          <p>
            Nothing is currently out to tender. New excavation contracts are published here as the
            heritage authority releases them.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tenders.map((t) => {
            const myBid = t.my_bid && t.my_bid.status !== "Withdrawn" ? t.my_bid : null;
            const closed = !t.bidding_open;
            return (
              <div
                key={t._id}
                className="card"
                style={{ margin: 0, borderLeft: `3px solid ${closed ? "var(--border-strong)" : "var(--accent)"}` }}
              >
                <div className="report-header">
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.2rem" }}>{t.title}</h3>
                    <p className="meta-row">
                      <span>
                        <MapPin size={13} aria-hidden="true" />{" "}
                        {t.location?.address || "Location held on file"}
                      </span>
                    </p>
                  </div>
                  {myBid && <StatusBadge status={myBid.status} />}
                </div>

                <p style={{ fontSize: "0.9375rem", marginTop: "0.85rem" }}>{t.project_details}</p>
                {t.requirements && (
                  <div className="subtle" style={{ marginBottom: "1rem" }}>
                    <span className="stat-label">Requirements</span>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.875rem" }}>{t.requirements}</p>
                  </div>
                )}

                <dl className="detail-list" style={{ margin: "1rem 0" }}>
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
                    <dd className="num" style={{ color: closed ? "var(--danger)" : "var(--text)" }}>
                      {new Date(t.deadline).toLocaleDateString()} · {daysLeft(t.deadline)}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Users size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Bids received
                    </dt>
                    <dd className="num">{t.bid_count}</dd>
                  </div>
                </dl>

                {myBid && (
                  <div className="alert alert-info">
                    <CheckCircle2 size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Your bid: ৳{myBid.cost?.toLocaleString()} over {myBid.timeline_days} days ·
                      status <strong>{myBid.status}</strong>. <Link to="/et/bids">Manage bid</Link>
                    </span>
                  </div>
                )}

                <div
                  className="actions"
                  style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
                >
                  <button className="btn" onClick={() => openBidForm(t)} disabled={closed}>
                    <Gavel size={14} aria-hidden="true" /> {myBid ? "Revise bid" : "Submit a bid"}
                  </button>
                  {closed && <span className="hint">Bidding has closed on this tender.</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bidding && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Tender bid</span>
                <h2>
                  {bidding.my_bid && bidding.my_bid.status !== "Withdrawn"
                    ? "Revise your bid"
                    : "Submit a bid"}
                </h2>
              </div>
              <button className="modal-close" onClick={() => setBidding(null)} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="hint">
              {bidding.title} — estimated budget ৳{bidding.estimated_budget?.toLocaleString()}. Bids
              close {new Date(bidding.deadline).toLocaleString()}.
            </p>

            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={submitBid} className="form">
              <div className="form-row">
                <label>
                  Bid price (৳)
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="e.g. 450000"
                    required
                  />
                </label>
                <label>
                  Programme (days)
                  <input
                    type="number"
                    min="1"
                    value={form.timeline_days}
                    onChange={(e) => setForm({ ...form, timeline_days: e.target.value })}
                    placeholder="e.g. 90"
                    required
                  />
                </label>
              </div>
              <label>
                Method statement
                <textarea
                  rows={5}
                  value={form.proposal}
                  onChange={(e) => setForm({ ...form, proposal: e.target.value })}
                  placeholder="Excavation methodology, equipment, crew composition, recording standards, and site protection measures"
                  required
                />
              </label>

              {bidding.location?.lat != null && (
                <fieldset>
                  <legend>Site location</legend>
                  <GoogleMapPicker value={bidding.location} editable={false} height={200} />
                </fieldset>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBidding(null)} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busy}>
                  {busy ? "Submitting" : "Submit bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
