import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, Gavel, Ticket } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
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
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Gavel size={17} /> Live Auctions
          </h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {live.map((a) => (
              <Link key={a._id} to={`/auctions/${a._id}`} className="card" style={{ ...cardStyle, textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <h4 style={{ margin: 0 }}>{a.item?.name}</h4>
                  <StatusBadge status="Active" />
                </div>
                <p style={{ fontSize: "0.85rem", color: "#8a7a68", margin: 0 }}>{a.item?.Type}</p>
                <p style={{ fontSize: "0.95rem", margin: 0 }}>
                  Current bid: <strong>৳{a.current_bid ?? a.starting_bid}</strong>
                </p>
                <p style={{ fontSize: "0.85rem", color: "#8a7a68", margin: 0 }}>
                  {timeLeft(a.deadline)} · {a.bid_count} bid(s)
                </p>
              </Link>
            ))}
            {live.length === 0 && <p className="hint">No live auctions match your search.</p>}
          </div>
        </div>

        {user && myBids.length > 0 && (
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Ticket size={17} /> My Bids
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {myBids.map((b) => (
                <div key={b._id} className="card" style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <h4 style={{ margin: 0 }}>{b.item?.name}</h4>
                    <StatusBadge status={b.secured ? "Secured" : "Not Secured"} />
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#8a7a68", margin: 0 }}>{b.item?.Type}</p>
                  <p style={{ fontSize: "0.95rem", margin: 0 }}>
                    Your bid: <strong>৳{b.my_bid}</strong> · Current: ৳{b.current_bid}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                    <StatusBadge status={b.status === "Active" ? "Active" : "Closed"} />
                    <Link className="btn-small" to={`/auctions/${b._id}`}>
                      {b.status === "Active" ? "Bid Higher" : "View"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {user && wishlist.length > 0 && (
        <>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "2rem" }}>
            <Heart size={17} /> My Wishlist
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {wishlist.map((w) => (
              <div key={w._id} className="card" style={cardStyle}>
                <h4 style={{ margin: 0 }}>{w.item.name}</h4>
                <p style={{ fontSize: "0.85rem", color: "#8a7a68", margin: 0 }}>{w.item.Type}</p>
                {w.active_auction ? (
                  <>
                    <p style={{ fontSize: "0.9rem", margin: 0 }}>
                      Up for auction - {timeLeft(w.active_auction.deadline)}
                      <br />
                      Current bid: ৳{w.active_auction.current_bid ?? w.active_auction.starting_bid}
                    </p>
                    <Link className="btn-small" to={`/auctions/${w.active_auction._id}`} style={{ alignSelf: "flex-start" }}>
                      View Auction
                    </Link>
                  </>
                ) : (
                  <p className="hint" style={{ margin: 0 }}>Not currently up for auction.</p>
                )}
                <button className="btn-link" style={{ alignSelf: "flex-start" }} onClick={() => removeFromWishlist(w.item._id)}>
                  Remove from wishlist
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
