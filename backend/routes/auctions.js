const express = require("express");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Wishlist = require("../models/Wishlist");
const Item = require("../models/Item");
const { optionalAuth, requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Everyone can browse (optionalAuth just tells us who's logged in, if anyone).
// Individual routes below layer on requireAuth / requireRole("admin") as needed.
router.use(optionalAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Lazily closes an auction if its deadline has passed. Called on every read
// so auctions close promptly even without a person hitting the sweep below.
async function closeIfExpired(auction) {
  if (auction.status !== "Active" || auction.deadline > new Date()) return auction;

  const met_reserve = auction.reserve_price == null || (auction.current_bid ?? 0) >= auction.reserve_price;

  if (auction.current_bid != null && met_reserve) {
    auction.status = "Closed-Sold";
    auction.winner = auction.current_bidder;
    auction.final_price = auction.current_bid;
  } else {
    auction.status = "Closed-Unsold";
  }
  auction.closed_at = new Date();
  await auction.save();
  return auction;
}

// Periodic sweep so auctions close even if nobody happens to view them right
// at the deadline. Runs once per minute for the lifetime of the process.
async function sweepExpiredAuctions() {
  try {
    const expired = await Auction.find({ status: "Active", deadline: { $lte: new Date() } });
    for (const a of expired) await closeIfExpired(a);
  } catch (err) {
    console.error("Auction sweep failed:", err.message);
  }
}
setInterval(sweepExpiredAuctions, 60 * 1000);

const MIN_NEXT_BID = (auction) => (auction.current_bid != null ? auction.current_bid + auction.min_increment : auction.starting_bid);

function serializeAuction(auction, viewerIsAdmin) {
  const item = auction.item && auction.item.name ? auction.item : null;
  const base = {
    _id: auction._id,
    item: item
      ? {
          _id: item._id,
          name: item.name,
          picture: item.picture,
          Type: item.Type,
          civilization: item.civilization,
          era: item.era,
          region: item.region,
          material: item.material,
          usage: item.usage,
          description: item.description,
        }
      : auction.item, // not populated
    starting_bid: auction.starting_bid,
    min_increment: auction.min_increment,
    current_bid: auction.current_bid,
    current_bidder: auction.current_bidder,
    minimum_next_bid: MIN_NEXT_BID(auction),
    bid_count: auction.bid_count,
    deadline: auction.deadline,
    extend_trigger_minutes: auction.extend_trigger_minutes,
    extend_by_minutes: auction.extend_by_minutes,
    extension_count: auction.extension_count,
    status: auction.status,
    closed_at: auction.closed_at,
    winner: auction.winner,
    final_price: auction.final_price,
    createdAt: auction.createdAt,
  };
  if (viewerIsAdmin) {
    base.reserve_price = auction.reserve_price;
    base.source_percentage = auction.source_percentage;
    base.source_name = auction.source_name;
    base.cancel_reason = auction.cancel_reason;
    base.created_by = auction.created_by;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Browsing (public - optionalAuth already applied above)
// ---------------------------------------------------------------------------

// GET /api/auctions?status=Active&q=bronze
router.get("/", async (req, res) => {
  const { status, q } = req.query;
  const isAdmin = req.user?.role === "admin";

  const filter = {};
  if (status) {
    if (status === "Closed" && !isAdmin) {
      return res.json({ auctions: [] }); // past auction history is admin-only
    }
    filter.status = status === "Closed" ? { $in: ["Closed-Sold", "Closed-Unsold", "Cancelled"] } : status;
  } else {
    filter.status = "Active";
  }

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matchingItems = await Item.find({
      $or: [{ name: rx }, { civilization: rx }, { era: rx }, { region: rx }, { material: rx }, { usage: rx }],
    }).select("_id");
    filter.item = { $in: matchingItems.map((i) => i._id) };
  }

  let auctions = await Auction.find(filter).populate("item", "name picture Type civilization era region material usage description").sort({ deadline: 1 });
  auctions = await Promise.all(auctions.map(closeIfExpired));

  res.json({ auctions: auctions.map((a) => serializeAuction(a, isAdmin)) });
});

// GET /api/auctions/:id
router.get("/:id", async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  let auction = await Auction.findById(req.params.id).populate("item", "name picture Type civilization era region material usage description location");
  if (!auction) return res.status(404).json({ error: "Auction not found." });
  auction = await closeIfExpired(auction);

  // Bid-by-bid history (who bid what, when) is only visible to admins -
  // everyone else just sees the current highest bid.
  let bids = [];
  if (isAdmin) {
    const bidDocs = await Bid.find({ auction: auction._id }).populate("bidder", "name").sort({ amount: -1 }).limit(30);
    bids = bidDocs.map((b) => ({ _id: b._id, bidder_name: b.bidder?.name || "Unknown", amount: b.amount, placed_at: b.placed_at }));
  }

  res.json({
    auction: serializeAuction(auction, isAdmin),
    bids,
  });
});

// ---------------------------------------------------------------------------
// Bidding & wishlist (any logged-in user)
// ---------------------------------------------------------------------------

// POST /api/auctions/:id/bid  { amount }
router.post("/:id/bid", requireAuth, async (req, res) => {
  try {
    let auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found." });

    auction = await closeIfExpired(auction);
    if (auction.status !== "Active") {
      return res.status(400).json({ error: "This auction is no longer accepting bids." });
    }
    if (String(auction.created_by) === String(req.user._id)) {
      return res.status(403).json({ error: "You cannot bid on an auction you created." });
    }

    const amount = Number(req.body.amount);
    const minNext = MIN_NEXT_BID(auction);
    if (!Number.isFinite(amount) || amount < minNext) {
      return res.status(400).json({ error: `Bid must be at least ${minNext}.` });
    }

    await Bid.create({ auction: auction._id, bidder: req.user._id, amount });

    auction.current_bid = amount;
    auction.current_bidder = req.user._id;
    auction.bid_count += 1;

    // Anti-sniping: extend the deadline if this bid landed inside the trigger window.
    const triggerMs = auction.extend_trigger_minutes * 60 * 1000;
    const extendMs = auction.extend_by_minutes * 60 * 1000;
    const msLeft = auction.deadline.getTime() - Date.now();
    let extended = false;
    if (triggerMs > 0 && msLeft <= triggerMs && msLeft > 0) {
      auction.deadline = new Date(Date.now() + extendMs);
      auction.extension_count += 1;
      extended = true;
    }

    await auction.save();
    res.status(201).json({ message: "Bid placed.", extended, auction: serializeAuction(auction, req.user.role === "admin") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not place bid." });
  }
});

// GET /api/auctions/mine/bids -> auctions the current user has bid on
router.get("/mine/bids", requireAuth, async (req, res) => {
  const myBids = await Bid.find({ bidder: req.user._id }).sort({ placed_at: -1 });

  const byAuction = new Map();
  for (const b of myBids) {
    const key = String(b.auction);
    if (!byAuction.has(key)) byAuction.set(key, b.amount); // first hit is the most recent (already sorted desc)
  }

  const auctionIds = [...byAuction.keys()];
  let auctions = await Auction.find({ _id: { $in: auctionIds } }).populate("item", "name picture Type");
  auctions = await Promise.all(auctions.map(closeIfExpired));

  const results = auctions.map((a) => ({
    ...serializeAuction(a, false),
    my_bid: byAuction.get(String(a._id)),
    secured: String(a.current_bidder) === String(req.user._id),
  }));

  res.json({ bids: results });
});

// GET /api/auctions/mine/wishlist
router.get("/mine/wishlist", requireAuth, async (req, res) => {
  const entries = await Wishlist.find({ user: req.user._id }).populate("item", "name picture Type civilization era region material usage").sort({ added_at: -1 });

  const itemIds = entries.map((e) => e.item?._id).filter(Boolean);
  const activeAuctions = await Auction.find({ item: { $in: itemIds }, status: "Active" }).select("item deadline current_bid starting_bid");
  const auctionByItem = Object.fromEntries(activeAuctions.map((a) => [String(a.item), a]));

  res.json({
    wishlist: entries
      .filter((e) => e.item)
      .map((e) => {
        const auction = auctionByItem[String(e.item._id)];
        return {
          _id: e._id,
          item: e.item,
          added_at: e.added_at,
          active_auction: auction
            ? { _id: auction._id, deadline: auction.deadline, current_bid: auction.current_bid, starting_bid: auction.starting_bid }
            : null,
        };
      }),
  });
});

// POST /api/auctions/wishlist/:itemId
router.post("/wishlist/:itemId", requireAuth, async (req, res) => {
  try {
    await Wishlist.create({ user: req.user._id, item: req.params.itemId });
    res.status(201).json({ message: "Added to wishlist." });
  } catch (err) {
    if (err.code === 11000) return res.status(200).json({ message: "Already on your wishlist." });
    res.status(500).json({ error: "Could not add to wishlist." });
  }
});

// DELETE /api/auctions/wishlist/:itemId
router.delete("/wishlist/:itemId", requireAuth, async (req, res) => {
  await Wishlist.deleteOne({ user: req.user._id, item: req.params.itemId });
  res.json({ message: "Removed from wishlist." });
});

// ---------------------------------------------------------------------------
// Admin management
// ---------------------------------------------------------------------------

// GET /api/auctions/admin/candidates -> items available to put up for auction
router.get("/admin/candidates", requireRole("admin"), async (req, res) => {
  const activeAuctionItemIds = (await Auction.find({ status: "Active" }).select("item")).map((a) => String(a.item));
  const items = await Item.find({ _id: { $nin: activeAuctionItemIds } }).select("name Type civilization era allocation").sort({ allocation: -1, name: 1 });
  res.json({ items });
});

// POST /api/auctions -> create
router.post("/", requireRole("admin"), async (req, res) => {
  try {
    const { item, starting_bid, min_increment, deadline, reserve_price, source_percentage, source_name, extend_trigger_minutes, extend_by_minutes } = req.body;

    if (!item || starting_bid == null || min_increment == null || !deadline) {
      return res.status(400).json({ error: "Artifact, starting bid, minimum increment, and deadline are required." });
    }
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ error: "Deadline must be in the future." });
    }

    const alreadyActive = await Auction.findOne({ item, status: "Active" });
    if (alreadyActive) {
      return res.status(400).json({ error: "This artifact already has an active auction." });
    }

    const auction = await Auction.create({
      item,
      created_by: req.user._id,
      starting_bid: Number(starting_bid),
      min_increment: Number(min_increment),
      deadline,
      reserve_price: reserve_price !== "" && reserve_price != null ? Number(reserve_price) : null,
      source_percentage: source_percentage != null && source_percentage !== "" ? Number(source_percentage) : 0,
      source_name: source_name || "",
      extend_trigger_minutes: extend_trigger_minutes != null && extend_trigger_minutes !== "" ? Number(extend_trigger_minutes) : 2,
      extend_by_minutes: extend_by_minutes != null && extend_by_minutes !== "" ? Number(extend_by_minutes) : 2,
    });

    res.status(201).json({ auction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create auction." });
  }
});

// PUT /api/auctions/:id -> edit
// Full edit while bid_count === 0. Once bidding has started, only
// deadline (extend only), reserve_price, source_percentage, and source_name
// can change - protects bidders from the rules shifting under them.
router.put("/:id", requireRole("admin"), async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ error: "Auction not found." });
  if (auction.status !== "Active") {
    return res.status(400).json({ error: "Only active auctions can be edited." });
  }

  const { item, starting_bid, min_increment, deadline, reserve_price, source_percentage, source_name, extend_trigger_minutes, extend_by_minutes } = req.body;

  if (auction.bid_count === 0) {
    if (item) auction.item = item;
    if (starting_bid != null) auction.starting_bid = Number(starting_bid);
    if (min_increment != null) auction.min_increment = Number(min_increment);
    if (extend_trigger_minutes != null) auction.extend_trigger_minutes = Number(extend_trigger_minutes);
    if (extend_by_minutes != null) auction.extend_by_minutes = Number(extend_by_minutes);
    if (deadline) auction.deadline = deadline;
  } else if (deadline) {
    if (new Date(deadline) <= auction.deadline) {
      return res.status(400).json({ error: "Once bidding has started, the deadline can only be extended, not shortened." });
    }
    auction.deadline = deadline;
  }

  if (reserve_price !== undefined) auction.reserve_price = reserve_price !== "" && reserve_price != null ? Number(reserve_price) : null;
  if (source_percentage !== undefined) auction.source_percentage = source_percentage !== "" ? Number(source_percentage) : 0;
  if (source_name !== undefined) auction.source_name = source_name;

  await auction.save();
  res.json({ auction });
});

// POST /api/auctions/:id/cancel  { reason }
router.post("/:id/cancel", requireRole("admin"), async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ error: "Auction not found." });
  if (auction.status !== "Active") {
    return res.status(400).json({ error: "Only active auctions can be cancelled." });
  }
  if (!req.body.reason || !req.body.reason.trim()) {
    return res.status(400).json({ error: "Please provide a reason for cancelling." });
  }

  auction.status = "Cancelled";
  auction.cancel_reason = req.body.reason.trim();
  auction.closed_at = new Date();
  await auction.save();

  res.json({ message: "Auction cancelled.", auction });
});

// DELETE /api/auctions/:id -> only safe to hard-delete if nobody has bid yet
router.delete("/:id", requireRole("admin"), async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ error: "Auction not found." });
  if (auction.bid_count > 0) {
    return res.status(400).json({ error: "This auction already has bids - cancel it instead of deleting." });
  }
  await Auction.deleteOne({ _id: auction._id });
  res.json({ message: "Auction deleted." });
});

module.exports = router;
