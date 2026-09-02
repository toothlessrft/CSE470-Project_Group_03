import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, HeartOff, AlertTriangle } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";

function timeLeft(deadline) {
  const ms = new Date(deadline) - new Date();
  if (ms <= 0) return "Ended";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ${Math.floor((ms % 60000) / 1000)}s left`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m left`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h left`;
}

export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [onWishlist, setOnWishlist] = useState(false);
  const [, forceTick] = useState(0);

  function load() {
    api.get(`/auctions/${id}`).then((data) => {
      setAuction(data.auction);
      setBids(data.bids);
      setBidAmount(data.auction.minimum_next_bid);
    });
  }

  useEffect(load, [id]);

  useEffect(() => {
    if (!user) return;
    api.get("/auctions/mine/wishlist").then((data) => {
      setOnWishlist(data.wishlist.some((w) => w.item._id === auction?.item?._id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, auction?.item?._id]);

  // Live-ish countdown + poll for updates while the auction is close to ending
  useEffect(() => {
    const tick = setInterval(() => forceTick((n) => n + 1), 1000);
    let poll;
    if (auction?.status === "Active") {
      const msLeft = new Date(auction.deadline) - new Date();
      if (msLeft < 5 * 60 * 1000) {
        poll = setInterval(load, 10000);
      }
    }
    return () => {
      clearInterval(tick);
      if (poll) clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction?.status, auction?.deadline]);

  async function toggleWishlist() {
    if (!user) return;
    if (onWishlist) {
      await api.del(`/auctions/wishlist/${auction.item._id}`);
      setOnWishlist(false);
    } else {
      await api.post(`/auctions/wishlist/${auction.item._id}`, {});
      setOnWishlist(true);
    }
  }

  async function confirmBid() {
    setError("");
    setBusy(true);
    try {
      const data = await api.post(`/auctions/${id}/bid`, { amount: bidAmount });
      setMessage(data.extended ? "Bid placed! The deadline was extended since this came in right at the end." : "Bid placed!");
      setConfirming(false);
      load();
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (!auction) return <div className="page">Loading...</div>;

  const item = auction.item;
  const isActive = auction.status === "Active";
  const isCreator = user && auction.created_by && String(auction.created_by) === String(user._id);

  return (
    <div className="page narrow">
      <Link to="/auctions" className="btn-link">
        ← Back to Auctions
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: "0.3rem" }}>{item?.name}</h1>
          <p className="page-subtitle" style={{ marginTop: 0 }}>
            {item?.Type} {item?.civilization ? `· ${item.civilization}` : ""} {item?.era ? `· ${item.era}` : ""}
          </p>
        </div>
        {user && (
          <button className="btn-small" onClick={toggleWishlist}>
            {onWishlist ? <HeartOff size={14} /> : <Heart size={14} />} {onWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>
        )}
      </div>

      <div className="card">
        <p>{item?.description || "No description available."}</p>
        <p style={{ fontSize: "0.9rem" }}>
          {item?.region && <>Region: {item.region}<br /></>}
          {item?.material && <>Material: {item.material}<br /></>}
          {item?.usage && <>Usage: {item.usage}</>}
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <StatusBadge status={isActive ? "Active" : auction.status.replace("Closed-", "")} />
          <strong>{isActive ? timeLeft(auction.deadline) : "Bidding closed"}</strong>
        </div>

        {auction.extension_count > 0 && (
          <p style={{ fontSize: "0.85rem", color: "#b5834d" }}>
            ⏱ This auction's deadline has been extended {auction.extension_count} time(s) due to last-minute bids.
          </p>
        )}

        <p style={{ fontSize: "1.1rem", margin: "0.5rem 0" }}>
          Current bid: <strong>৳{auction.current_bid ?? auction.starting_bid}</strong>
          {auction.current_bid == null && <span style={{ color: "#8a7a68" }}> (starting price, no bids yet)</span>}
        </p>
        <p style={{ fontSize: "0.9rem", color: "#8a7a68" }}>Minimum increment: ৳{auction.min_increment} · {auction.bid_count} bid(s) placed</p>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {isActive && !user && (
          <p>
            <a href="/login">Log in</a> to place a bid.
          </p>
        )}

        {isActive && user && isCreator && <p className="page-subtitle">You created this auction, so you can't bid on it.</p>}

        {isActive && user && !isCreator && (
          <div style={{ marginTop: "1rem" }}>
            <label>
              Your bid (minimum ৳{auction.minimum_next_bid})
              <input
                type="number"
                min={auction.minimum_next_bid}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </label>
            {!confirming ? (
              <button
                className="btn"
                style={{ background: "var(--danger)", borderColor: "var(--danger)", marginTop: "0.75rem" }}
                onClick={() => setConfirming(true)}
                disabled={!bidAmount || Number(bidAmount) < auction.minimum_next_bid}
              >
                Place Bid
              </button>
            ) : (
              <div className="alert alert-danger" style={{ marginTop: "0.75rem" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
                  <AlertTriangle size={16} /> This cannot be undone.
                </p>
                <p style={{ margin: "0 0 0.75rem" }}>
                  You're about to bid ৳{bidAmount} on {item?.name}. Once placed, this bid cannot be withdrawn or lowered.
                </p>
                <div className="actions">
                  <button className="btn-small" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" }} onClick={confirmBid} disabled={busy}>
                    {busy ? "Placing..." : "Yes, place this bid"}
                  </button>
                  <button className="btn-small" onClick={() => setConfirming(false)} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isActive && auction.status === "Closed-Sold" && (
          <p>
            Sold for <strong>৳{auction.final_price}</strong>
            {auction.winner && (
              <>
                {" "}to <strong>{auction.winner.name} ({auction.winner.nid})</strong>
                {user && String(auction.winner._id) === String(user._id) && " - you won this auction!"}
              </>
            )}
          </p>
        )}
        {!isActive && auction.status === "Closed-Unsold" && <p>This auction closed without a winning bid.</p>}
        {!isActive && auction.status === "Cancelled" && <p>This auction was cancelled by an administrator.</p>}
      </div>

      {user?.role === "admin" && (
        <>
          <h3>Bid History</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Amount</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b._id}>
                  <td>{b.bidder_name}</td>
                  <td>৳{b.amount}</td>
                  <td>{new Date(b.placed_at).toLocaleString()}</td>
                </tr>
              ))}
              {bids.length === 0 && (
                <tr>
                  <td colSpan={3}>No bids yet - be the first!</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
