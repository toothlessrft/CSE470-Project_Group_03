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
        setSuccess("Your bid has been updated.");
      } else {
        await api.post(`/tenders/${bidding._id}/bids`, form);
        setSuccess("Bid submitted. You can edit or withdraw it until the deadline.");
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
        <p className="hint">Loading tenders...</p>
      </div>
    );

  return (
    <div className="page">
      <h1>Available Excavation Tenders</h1>
      <p className="page-subtitle">
        Government-published excavation contracts open for bidding. Submit your cost, timeline, and
        proposal — you can revise or withdraw any bid until the deadline passes.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {tenders.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          <FileSearch size={28} style={{ marginBottom: "0.5rem" }} />
          <p style={{ margin: 0 }}>No open tenders right now. Check back soon.</p>
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
                style={{ margin: 0, borderLeft: `4px solid ${closed ? "var(--muted)" : "var(--accent)"}` }}
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
                      {t.location?.address || "Location on file"}
                    </p>
                  </div>
                  {myBid && <StatusBadge status={myBid.status} />}
                </div>

                <p style={{ fontSize: "0.92rem", marginTop: "0.85rem" }}>{t.project_details}</p>
                {t.requirements && (
                  <p style={{ fontSize: "0.88rem" }}>
                    <strong>Requirements:</strong> {t.requirements}
                  </p>
                )}

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
                    <Banknote size={15} /> Est. budget:{" "}
                    <strong style={{ color: "var(--text)" }}>
                      ৳{t.estimated_budget?.toLocaleString()}
                    </strong>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <CalendarClock size={15} /> Deadline:{" "}
                    <strong style={{ color: closed ? "var(--danger)" : "var(--text)" }}>
                      {new Date(t.deadline).toLocaleDateString()} ({daysLeft(t.deadline)})
                    </strong>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Users size={15} /> {t.bid_count} bid{t.bid_count === 1 ? "" : "s"}
                  </span>
                </div>

                {myBid && (
                  <div className="alert alert-info" style={{ marginBottom: "0.75rem" }}>
                    <CheckCircle2 size={14} style={{ verticalAlign: "middle" }} /> Your bid: ৳
                    {myBid.cost?.toLocaleString()} over {myBid.timeline_days} days — status{" "}
                    <strong>{myBid.status}</strong>.{" "}
                    <Link to="/et/bids">Manage it here.</Link>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                  }}
                >
                  <button className="btn" onClick={() => openBidForm(t)} disabled={closed}>
                    <Gavel size={14} /> {myBid ? "Revise Bid" : "Submit Bid"}
                  </button>
                  {closed && <span className="hint">Bidding on this tender has closed.</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bidding && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", margin: 0 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ margin: 0 }}>
                {bidding.my_bid && bidding.my_bid.status !== "Withdrawn" ? "Revise Bid" : "Submit Bid"}
              </h2>
              <button className="btn-link" onClick={() => setBidding(null)}>
                <X size={20} />
              </button>
            </div>

            <p className="hint">
              {bidding.title} — estimated budget ৳{bidding.estimated_budget?.toLocaleString()}, bids
              close {new Date(bidding.deadline).toLocaleString()}.
            </p>

            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={submitBid} className="form">
              <label>
                Bid Cost (৳) (required)
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
                Timeline (days) (required)
                <input
                  type="number"
                  min="1"
                  value={form.timeline_days}
                  onChange={(e) => setForm({ ...form, timeline_days: e.target.value })}
                  placeholder="e.g. 90"
                  required
                />
              </label>
              <label>
                Proposal (required)
                <textarea
                  rows={5}
                  value={form.proposal}
                  onChange={(e) => setForm({ ...form, proposal: e.target.value })}
                  placeholder="Methodology, equipment, crew composition, and how you'll protect the site..."
                  required
                />
              </label>

              {bidding.location?.lat != null && (
                <fieldset>
                  <legend>Excavation Site</legend>
                  <GoogleMapPicker value={bidding.location} editable={false} height={200} />
                </fieldset>
              )}

              <button type="submit" className="btn" disabled={busy}>
                {busy ? "Submitting..." : "Submit Bid"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
