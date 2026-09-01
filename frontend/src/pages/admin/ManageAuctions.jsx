import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Gavel } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

function timeLeft(deadline) {
  const ms = new Date(deadline) - new Date();
  if (ms <= 0) return "Ended";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m left`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h left`;
}

export default function ManageAuctions() {
  const [live, setLive] = useState([]);
  const [history, setHistory] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  function loadLive() {
    api.get("/auctions?status=Active").then((data) => setLive(data.auctions));
  }

  function loadHistory() {
    const params = new URLSearchParams({ status: "Closed" });
    if (q) params.set("q", q);
    api.get(`/auctions?${params.toString()}`).then((data) => {
      let rows = data.auctions;
      if (statusFilter) rows = rows.filter((a) => a.status === statusFilter);
      setHistory(rows);
    });
  }

  useEffect(loadLive, []);
  useEffect(loadHistory, [q, statusFilter]);

  async function handleCancel(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/auctions/${cancelTarget}/cancel`, { reason: cancelReason });
      setCancelTarget(null);
      setCancelReason("");
      loadLive();
      loadHistory();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Lawful disposal</span>
          <h1>Artifact auctions</h1>
          <p className="page-subtitle">
            List artifacts released for lawful sale and follow bidding through to close.
          </p>
        </div>
        <Link className="btn" to="/admin/auctions/new">
          <Plus size={16} aria-hidden="true" /> Create lot
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="section-head">
        <h2>
          <Gavel size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
          Bidding open
        </h2>
        <span className="hint">{live.length} live</span>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Standing bid</th>
            <th>Bids</th>
            <th>Closes in</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {live.map((a) => (
            <tr key={a._id}>
              <td>{a.item?.name}</td>
              <td className="num">
                {a.current_bid != null
                  ? `৳${Number(a.current_bid).toLocaleString()}`
                  : `Reserve ৳${Number(a.starting_bid).toLocaleString()}`}
              </td>
              <td className="num">{a.bid_count}</td>
              <td>{timeLeft(a.deadline)}</td>
              <td className="actions">
                <Link className="btn-small btn-secondary" to={`/admin/auctions/${a._id}/edit`}>
                  Edit
                </Link>
                <button className="btn-small btn-deny" onClick={() => setCancelTarget(a._id)}>
                  Withdraw
                </button>
              </td>
            </tr>
          ))}
          {live.length === 0 && (
            <tr>
              <td colSpan={5} className="hint">
                No lots are currently open for bidding.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {cancelTarget && (
        <div className="modal-overlay">
          <form onSubmit={handleCancel} className="modal form" style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Auction</span>
                <h2>Withdraw this lot?</h2>
              </div>
            </div>
            <p className="page-subtitle" style={{ marginTop: 0 }}>
              Bidding stops immediately and the reason is shown to everyone who bid.
            </p>
            <label>
              Reason for withdrawal
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCancelTarget(null)}>
                Keep the lot open
              </button>
              <button type="submit" className="btn btn-deny">
                Withdraw lot
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="section-head">
        <h2>Closed lots</h2>
        <span className="hint">{history.length} on record</span>
      </div>
      <form className="home-search-row" onSubmit={(e) => e.preventDefault()}>
        <label className="home-search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by artifact, civilization, or era"
            aria-label="Search closed lots"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by outcome"
          style={{ width: "auto" }}
        >
          <option value="">All outcomes</option>
          <option value="Closed-Sold">Sold</option>
          <option value="Closed-Unsold">Unsold</option>
          <option value="Cancelled">Withdrawn</option>
        </select>
      </form>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Hammer price</th>
            <th>Successful bidder</th>
            <th>Share to source</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {history.map((a) => (
            <tr key={a._id}>
              <td>{a.item?.name}</td>
              <td className="num">
                {a.final_price != null ? `৳${Number(a.final_price).toLocaleString()}` : "—"}
              </td>
              <td>
                {a.status === "Closed-Sold" && a.winner ? `${a.winner.name} (${a.winner.nid})` : "—"}
              </td>
              <td className="num">
                {a.final_price != null && a.source_percentage > 0
                  ? `৳${Math.round((a.final_price * a.source_percentage) / 100).toLocaleString()} · ${a.source_percentage}% to ${a.source_name || "source"}`
                  : "—"}
              </td>
              <td>
                <StatusBadge status={a.status.replace("Closed-", "")} />
              </td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan={5} className="hint">
                No lots have closed yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
