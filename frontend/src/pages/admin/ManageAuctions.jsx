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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Manage Auctions</h1>
          <p className="page-subtitle">Put artifacts up for auction and track bidding through to close.</p>
        </div>
        <Link className="btn" to="/admin/auctions/new">
          <Plus size={16} /> Create New Auction
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <h3>
        <Gavel size={16} style={{ verticalAlign: "text-bottom" }} /> Live Auctions
      </h3>
      <table className="table">
        <thead>
          <tr>
            <th>Artifact</th>
            <th>Current Bid</th>
            <th>Bids</th>
            <th>Time Left</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {live.map((a) => (
            <tr key={a._id}>
              <td>{a.item?.name}</td>
              <td>{a.current_bid != null ? `৳${a.current_bid}` : `Starting: ৳${a.starting_bid}`}</td>
              <td>{a.bid_count}</td>
              <td>{timeLeft(a.deadline)}</td>
              <td className="actions">
                <Link className="btn-small" to={`/admin/auctions/${a._id}/edit`}>
                  Edit
                </Link>
                <button className="btn-small btn-deny" onClick={() => setCancelTarget(a._id)}>
                  Cancel
                </button>
              </td>
            </tr>
          ))}
          {live.length === 0 && (
            <tr>
              <td colSpan={5}>No live auctions right now.</td>
            </tr>
          )}
        </tbody>
      </table>

      {cancelTarget && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <form onSubmit={handleCancel} className="card form" style={{ maxWidth: 420, width: "90%" }}>
            <h3 style={{ marginTop: 0 }}>Cancel this auction?</h3>
            <p className="page-subtitle">This stops bidding immediately. Please explain why.</p>
            <label>
              Reason
              <textarea required value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </label>
            <div className="actions">
              <button type="submit" className="btn-small btn-deny">
                Confirm Cancel
              </button>
              <button type="button" className="btn-small" onClick={() => setCancelTarget(null)}>
                Never mind
              </button>
            </div>
          </form>
        </div>
      )}

      <h3>Auction History</h3>
      <form
        style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}
        onSubmit={(e) => e.preventDefault()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ color: "#8a7a68" }} />
          <input type="text" placeholder="Search by artifact, civilization, era..." value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Closed-Sold">Sold</option>
          <option value="Closed-Unsold">Unsold</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Artifact</th>
            <th>Final Price</th>
            <th>Winner</th>
            <th>Payout to Source</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((a) => (
            <tr key={a._id}>
              <td>{a.item?.name}</td>
              <td>{a.final_price != null ? `৳${a.final_price}` : "-"}</td>
              <td>{a.status === "Closed-Sold" ? "Winning bidder" : "-"}</td>
              <td>
                {a.final_price != null && a.source_percentage > 0
                  ? `৳${Math.round((a.final_price * a.source_percentage) / 100)} (${a.source_percentage}% to ${a.source_name || "source"})`
                  : "-"}
              </td>
              <td>
                <StatusBadge status={a.status.replace("Closed-", "")} />
              </td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan={5}>No auction history yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
