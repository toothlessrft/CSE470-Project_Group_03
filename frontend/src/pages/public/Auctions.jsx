import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, Gavel, Ticket, Clock, Info } from "lucide-react";
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Lawful disposal</span>
          <h1>Artifact auctions</h1>
          <p className="page-subtitle">
            Lots released for lawful sale by the heritage authority. Bid, or keep watch on the ones
            that interest you.
          </p>
        </div>
      </div>

      {!user && (
        <div className="alert alert-info">
          <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <Link to="/login">Sign in</Link> or <Link to="/register">register</Link> to place bids
            and keep a watchlist.
          </span>
        </div>
      )}

      <form className="home-search-row" onSubmit={runSearch}>
        <label className="home-search-field">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search open lots by artifact, civilization, or era"
            aria-label="Search open auction lots"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      <div className={user && myBids.length > 0 ? "auction-split" : undefined}>
        <div>
          <div className="section-head">
            <h2>
              <Gavel size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
              Bidding open
            </h2>
            <span className="hint">{live.length} lots</span>
          </div>

          {live.length === 0 ? (
            <div className="empty-state">
              <Gavel size={24} aria-hidden="true" />
              <h3>No open lots</h3>
              <p>Nothing is currently open for bidding, or no lot matches your search.</p>
            </div>
          ) : (
            <div className="record-list" style={{ display: "block" }}>
              {live.map((a) => (
                <Link key={a._id} to={`/auctions/${a._id}`} className="record-row" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="record-main">
                    <h4>{a.item?.name}</h4>
                    <p className="artifact-tile-class">{a.item?.Type}</p>
                    <p className="meta-row">
                      <span>
                        <Clock size={13} aria-hidden="true" /> <TimeCounter deadline={a.deadline} />
                      </span>
                      <span>
                        {a.bid_count} bid{a.bid_count === 1 ? "" : "s"}
                      </span>
                    </p>
                  </div>
                  <div className="record-side" style={{ flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                    <span className="stat-label" style={{ margin: 0 }}>
                      Standing bid
                    </span>
                    <strong className="num" style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--primary-dark)" }}>
                      ৳{Number(a.current_bid ?? a.starting_bid).toLocaleString()}
                    </strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {user && myBids.length > 0 && (
          <div>
            <div className="section-head">
              <h2>
                <Ticket size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
                Your bids
              </h2>
              <span className="hint">{myBids.length} placed</span>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {myBids.map((b) => (
                <div
                  key={b._id}
                  className="card"
                  style={{
                    margin: 0,
                    borderLeft: `3px solid ${b.secured ? "var(--success)" : "var(--danger)"}`,
                  }}
                >
                  <div className="report-header">
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: 0 }}>{b.item?.name}</h4>
                      <p className="artifact-tile-class">{b.item?.Type}</p>
                    </div>
                    <StatusBadge status={b.secured ? "Secured" : "Not Secured"} />
                  </div>

                  <p className="meta-row">
                    <span>
                      Your bid: <strong className="num">৳{Number(b.my_bid).toLocaleString()}</strong>
                    </span>
                    {b.current_bid && b.current_bid !== b.my_bid && (
                      <span>
                        Standing: <span className="num">৳{Number(b.current_bid).toLocaleString()}</span>
                      </span>
                    )}
                  </p>

                  {b.status === "Active" ? (
                    <div
                      className="actions"
                      style={{ marginTop: "0.9rem", justifyContent: "space-between" }}
                    >
                      <span className="hint" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={13} aria-hidden="true" /> <TimeCounter deadline={b.deadline} />
                      </span>
                      <Link className="btn-small" to={`/auctions/${b.auction_id || b._id}`}>
                        Raise your bid
                      </Link>
                    </div>
                  ) : (
                    <p className="hint" style={{ margin: "0.75rem 0 0" }}>
                      Bidding has closed on this lot.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {user && wishlist.length > 0 && (
        <>
          <div className="section-head">
            <h2>
              <Heart size={16} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.4rem", color: "var(--primary)" }} />
              Watchlist
            </h2>
            <span className="hint">{wishlist.length} artifacts</span>
          </div>
          <div className="artifact-grid">
            {wishlist.map((w) => (
              <div key={w._id} className="artifact-tile">
                <div className="artifact-tile-head">
                  <strong>{w.item.name}</strong>
                </div>
                <p className="artifact-tile-class">{w.item.Type}</p>

                {w.active_auction ? (
                  <>
                    <dl className="artifact-tile-facts" style={{ marginBottom: "0.75rem" }}>
                      <div>
                        <dt>Standing bid</dt>
                        <dd className="num">
                          ৳{Number(w.active_auction.current_bid ?? w.active_auction.starting_bid).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt>Closes</dt>
                        <dd>
                          <TimeCounter deadline={w.active_auction.deadline} />
                        </dd>
                      </div>
                    </dl>
                    <div className="actions">
                      <Link className="btn-small" to={`/auctions/${w.active_auction._id}`}>
                        View lot
                      </Link>
                      <button className="btn-small btn-secondary" onClick={() => removeFromWishlist(w.item._id)}>
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="hint" style={{ margin: "0 0 0.75rem" }}>
                      Not currently offered for sale.
                    </p>
                    <button className="btn-small btn-secondary" onClick={() => removeFromWishlist(w.item._id)}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {user?.role === "admin" && closed.length > 0 && (
        <>
          <div className="section-head">
            <h2>Recently closed</h2>
            <span className="hint">Visible to the heritage authority</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Hammer price</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {closed.map((a) => (
                  <tr key={a._id}>
                    <td>{a.item?.name}</td>
                    <td className="num">
                      {a.final_price != null ? `৳${Number(a.final_price).toLocaleString()}` : "—"}
                    </td>
                    <td>
                      <StatusBadge status={a.status.replace("Closed-", "")} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
