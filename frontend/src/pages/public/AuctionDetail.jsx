import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, HeartOff, AlertTriangle, ArrowLeft, Clock } from "lucide-react";
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

  // Countdown, and poll for new bids while the auction is close to ending.
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

  if (!auction)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the lot
        </div>
      </div>
    );

  const item = auction.item;
  const isActive = auction.status === "Active";
  const isCreator = user && auction.created_by && String(auction.created_by) === String(user._id);

  return (
    <div className="page narrow">
      <Link className="back-link" to="/auctions">
        <ArrowLeft size={14} aria-hidden="true" /> Back to auctions
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Auction lot</span>
          <h1>{item?.name}</h1>
          <p className="page-subtitle">
            {[item?.Type, item?.civilization, item?.era].filter(Boolean).join(" · ")}
          </p>
        </div>
        {user && (
          <button className="btn btn-secondary" onClick={toggleWishlist}>
            {onWishlist ? <HeartOff size={15} aria-hidden="true" /> : <Heart size={15} aria-hidden="true" />}{" "}
            {onWishlist ? "Stop watching" : "Watch this lot"}
          </button>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Catalogue entry</h3>
        </div>
        <div className="panel-body">
          <p>{item?.description || "No description is recorded for this artifact."}</p>
          <dl className="detail-list">
            {item?.region && (
              <div>
                <dt>Region</dt>
                <dd>{item.region}</dd>
              </div>
            )}
            {item?.material && (
              <div>
                <dt>Material</dt>
                <dd>{item.material}</dd>
              </div>
            )}
            {item?.usage && (
              <div>
                <dt>Use</dt>
                <dd>{item.usage}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Bidding</h3>
          <StatusBadge status={isActive ? "Active" : auction.status.replace("Closed-", "")} />
        </div>
        <div className="panel-body">
          <div className="stat-row" style={{ marginTop: 0 }}>
            <div className="stat">
              <span className="stat-label">Standing bid</span>
              <span className="stat-value">
                ৳{Number(auction.current_bid ?? auction.starting_bid).toLocaleString()}
              </span>
              {auction.current_bid == null && (
                <span className="hint">Reserve price — no bids yet</span>
              )}
            </div>
            <div className="stat">
              <span className="stat-label">Bids placed</span>
              <span className="stat-value">{auction.bid_count}</span>
            </div>
            <div className="stat">
              <span className="stat-label">{isActive ? "Closes in" : "Status"}</span>
              <span className="stat-value" style={{ fontSize: "1.05rem" }}>
                {isActive ? timeLeft(auction.deadline) : "Bidding closed"}
              </span>
            </div>
          </div>

          <p className="hint">
            Minimum increment ৳{Number(auction.min_increment).toLocaleString()}.
          </p>

          {auction.extension_count > 0 && (
            <div className="alert alert-warning">
              <Clock size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Closing time has been extended {auction.extension_count} time
                {auction.extension_count === 1 ? "" : "s"} because bids arrived near the deadline.
              </span>
            </div>
          )}

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {isActive && !user && (
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              <span>
                <Link to="/login">Sign in</Link> to place a bid on this lot.
              </span>
            </div>
          )}

          {isActive && user && isCreator && (
            <p className="hint" style={{ marginBottom: 0 }}>
              You listed this lot, so you cannot bid on it.
            </p>
          )}

          {isActive && user && !isCreator && (
            <div className="form" style={{ marginTop: "1rem" }}>
              <label>
                Your bid (minimum ৳{Number(auction.minimum_next_bid).toLocaleString()})
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
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setConfirming(true)}
                  disabled={!bidAmount || Number(bidAmount) < auction.minimum_next_bid}
                >
                  Place bid
                </button>
              ) : (
                <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                  <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong style={{ display: "block", marginBottom: "0.25rem" }}>
                      A bid cannot be withdrawn or lowered
                    </strong>
                    You are about to bid ৳{Number(bidAmount).toLocaleString()} on {item?.name}.
                    <span className="actions" style={{ marginTop: "0.75rem" }}>
                      <button className="btn-small btn-danger" onClick={confirmBid} disabled={busy}>
                        {busy ? "Placing" : "Confirm bid"}
                      </button>
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => setConfirming(false)}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {!isActive && auction.status === "Closed-Sold" && (
            <p style={{ marginBottom: 0 }}>
              Sold for <strong>৳{Number(auction.final_price).toLocaleString()}</strong>
              {auction.winner && (
                <>
                  {" "}
                  to{" "}
                  <strong>
                    {auction.winner.name} ({auction.winner.nid})
                  </strong>
                  {user && String(auction.winner._id) === String(user._id) &&
                    " — this lot is yours."}
                </>
              )}
            </p>
          )}
          {!isActive && auction.status === "Closed-Unsold" && (
            <p style={{ marginBottom: 0 }}>This lot closed without meeting its reserve.</p>
          )}
          {!isActive && auction.status === "Cancelled" && (
            <p style={{ marginBottom: 0 }}>This lot was withdrawn by the heritage authority.</p>
          )}
        </div>
      </div>

      {user?.role === "admin" && (
        <>
          <div className="section-head">
            <h2>Bid history</h2>
            <span className="hint">Visible to the heritage authority</span>
          </div>
          <div className="table-wrap">
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
                    <td className="num">৳{Number(b.amount).toLocaleString()}</td>
                    <td className="num">{new Date(b.placed_at).toLocaleString()}</td>
                  </tr>
                ))}
                {bids.length === 0 && (
                  <tr>
                    <td colSpan={3} className="hint">
                      No bids have been placed on this lot.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
