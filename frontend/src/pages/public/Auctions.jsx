import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, Gavel, Ticket, Clock } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";

// Dynamic time counter component that updates every second
function TimeCounter({ deadline }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    function update() {
      const ms = new Date(deadline) - new Date();
      if (ms <= 0) {
        setDisplay("Ended");
        return;
      }
      const mins = Math.floor(ms / 60000);
      if (mins < 60) return setDisplay(`${mins}m left`);
      const hours = Math.floor(mins / 60);
      if (hours < 24) return setDisplay(`${hours}h ${mins % 60}m left`);
      const days = Math.floor(hours / 24);
      setDisplay(`${days}d ${hours % 24}h left`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return <span>{display}</span>;
}

const cardStyle = { margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" };

export default function Auctions() {
  const { user } = useAuth();

  const [myBids, setMyBids] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [live, setLive] = useState([]);
  const [closed, setClosed] = useState([]);
  const [q, setQ] = useState("");

  function loadAll() {
    api.get("/auctions?status=Active").then((data) => setLive(data.auctions));
    if (user?.role === "admin") {
      api.get("/auctions?status=Closed").then((data) => setClosed(data.auctions.slice(0, 10)));
    }
    if (user) {
      api.get("/auctions/mine/bids").then((data) => setMyBids(data.bids));
      api.get("/auctions/mine/wishlist").then((data) => setWishlist(data.wishlist));
    }
  }

  useEffect(loadAll, [user]);

  function runSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams({ status: "Active" });
    if (q) params.set("q", q);
    api.get(`/auctions?${params.toString()}`).then((data) => setLive(data.auctions));
  }

  async function removeFromWishlist(itemId) {
    await api.del(`/auctions/wishlist/${itemId}`);
    setWishlist((w) => w.filter((entry) => entry.item._id !== itemId));
  }

  return (
    <div className="page">
      <h1>Auctions</h1>
      <p className="page-subtitle">Bid on artifacts released for auction, and track the ones you care about.</p>

      {!user && (
        <div className="alert alert-success">
          <a href="/login">Log in</a> or <a href="/register">register</a> to place bids and build a wishlist.
        </div>
      )}

      {/* Search bar - matches the Smart Artifact Search styling used elsewhere */}
      <form
        className="card"
        style={{ display: "flex", gap: "0.75rem", alignItems: "center", margin: "0 0 1.5rem" }}
        onSubmit={runSearch}
      >
        <Search size={18} style={{ flexShrink: 0, color: "#8a7a68" }} />
        <input
          type="text"
          placeholder="Search live auctions by artifact, civilization, era..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            padding: "0.65rem 0.8rem",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.98rem",
            fontFamily: "inherit",
          }}
        />
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      {/* Live Auctions (left) and My Bids (right), same card styling throughout */}
      <div style={{ display: "grid", gridTemplateColumns: user && myBids.length > 0 ? "1fr 1fr" : "1fr", gap: "2rem", alignItems: "start" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Gavel size={20} style={{ color: "#8b6f47" }} /> Live Auctions
          </h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {live.map((a) => (
              <Link
                key={a._id}
                to={`/auctions/${a._id}`}
                className="card"
                style={{
                  ...cardStyle,
                  textDecoration: "none",
                  color: "inherit",
                  borderLeft: "4px solid #8b6f47",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: "#fafaf8",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(139, 111, 71, 0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{a.item?.name}</h4>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff", background: "#22c55e", padding: "0.3rem 0.6rem", borderRadius: "12px" }}>ACTIVE</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.85rem", color: "#8a7a68", margin: "0.2rem 0" }}>{a.item?.Type}</p>
                <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px solid #e6d9cc" }}>
                  <p style={{ fontSize: "0.95rem", margin: "0.3rem 0", fontWeight: 600 }}>
                    ৳{a.current_bid ?? a.starting_bid}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#8a7a68" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Clock size={14} /> <TimeCounter deadline={a.deadline} />
                    </span>
                    <span>{a.bid_count} bid(s)</span>
                  </div>
                </div>
              </Link>
            ))}
            {live.length === 0 && <p className="hint">No live auctions match your search.</p>}
          </div>
        </div>

        {user && myBids.length > 0 && (
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Ticket size={20} style={{ color: "#8b6f47" }} /> My Bids
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {myBids.map((b) => (
                <div
                  key={b._id}
                  className="card"
                  style={{
                    ...cardStyle,
                    borderLeft: b.secured ? "4px solid #22c55e" : "4px solid #ef4444",
                    backgroundColor: b.secured ? "#f0fdf4" : "#fef2f2",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{b.item?.name}</h4>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#fff",
                        background: b.secured ? "#22c55e" : "#ef4444",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "12px",
                      }}
                    >
                      {b.secured ? "SECURED" : "NOT SECURED"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#8a7a68", margin: "0.2rem 0" }}>{b.item?.Type}</p>
                  <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: `1px solid ${b.secured ? "#d1fae5" : "#fee2e2"}` }}>
                    <p style={{ fontSize: "0.95rem", margin: "0.3rem 0" }}>
                      Your bid: <strong>৳{b.my_bid}</strong>
                      {b.current_bid && b.current_bid !== b.my_bid && <span style={{ color: "#8a7a68" }}> · Current: ৳{b.current_bid}</span>}
                    </p>
                    {b.status === "Active" && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#8a7a68", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={14} /> <TimeCounter deadline={b.deadline} />
                        </span>
                        <Link className="btn-small" to={`/auctions/${b.auction_id || b._id}`} style={{ fontSize: "0.85rem" }}>
                          Bid Higher
                        </Link>
                      </div>
                    )}
                    {b.status !== "Active" && (
                      <div style={{ marginTop: "0.6rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8a7a68", background: "#f3f1ef", padding: "0.25rem 0.5rem", borderRadius: "8px" }}>
                          CLOSED
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {user && wishlist.length > 0 && (
        <>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2rem", marginBottom: "1rem" }}>
            <Heart size={20} style={{ color: "#8b6f47" }} /> My Wishlist
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {wishlist.map((w) => (
              <div key={w._id} className="card" style={{ ...cardStyle, borderTop: "4px solid #8b6f47" }}>
                <h4 style={{ margin: 0, marginBottom: "0.3rem" }}>{w.item.name}</h4>
                <p style={{ fontSize: "0.85rem", color: "#8a7a68", margin: "0 0 0.6rem" }}>{w.item.Type}</p>
                {w.active_auction ? (
                  <>
                    <div style={{ background: "#fafaf8", padding: "0.6rem", borderRadius: "8px", marginBottom: "0.6rem" }}>
                      <p style={{ fontSize: "0.9rem", margin: "0.3rem 0", fontWeight: 600 }}>
                        ৳{w.active_auction.current_bid ?? w.active_auction.starting_bid}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "#8a7a68", margin: "0.3rem 0", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={14} /> <TimeCounter deadline={w.active_auction.deadline} />
                      </p>
                    </div>
                    <Link className="btn-small" to={`/auctions/${w.active_auction._id}`} style={{ alignSelf: "flex-start" }}>
                      View Auction
                    </Link>
                  </>
                ) : (
                  <p className="hint" style={{ margin: "0 0 0.6rem" }}>Not currently up for auction.</p>
                )}
                <button className="btn-link" style={{ alignSelf: "flex-start", fontSize: "0.85rem" }} onClick={() => removeFromWishlist(w.item._id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {user?.role === "admin" && closed.length > 0 && (
        <>
          <h3 style={{ marginTop: "2rem" }}>Recently Closed (admin only)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Artifact</th>
                <th>Final Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {closed.map((a) => (
                <tr key={a._id}>
                  <td>{a.item?.name}</td>
                  <td>{a.final_price != null ? `৳${a.final_price}` : "-"}</td>
                  <td>
                    <StatusBadge status={a.status.replace("Closed-", "")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
