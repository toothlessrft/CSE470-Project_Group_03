const express = require("express");
const Site = require("../models/Site");
const RequestMaintenance = require("../models/RequestMaintenance");
const Tender = require("../models/Tender"); // Tender Bidding System (Excavation Team): Ahad_23201016
const Bid = require("../models/Bid"); // Tender Bidding System (Excavation Team): Ahad_23201016
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("site_caretaker"));

// GET /api/sc/dashboard  (was /s_caretaker/dashboard)
router.get("/dashboard", async (req, res) => {
  const site = await Site.findById(req.user.roleProfile?.site);
  res.json({
    s_caretaker: {
      nid: req.user.nid,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      profile_pic: req.user.profile_pic,
      budget: req.user.roleProfile?.budget,
      site,
    },
  });
});

// GET/POST /api/sc/request_maintenance  (was /s_caretaker/request_maintenance)
router.get("/request_maintenance", async (req, res) => {
  const site = await Site.findById(req.user.roleProfile?.site);
  res.json({ site_id: site?._id, site_name: site?.name });
});

router.post("/request_maintenance", async (req, res) => {
  try {
    const { damage, repair_cost } = req.body;
    const request = await RequestMaintenance.create({
      site: req.user.roleProfile?.site,
      caretaker: req.user._id,
      damage,
      repair_cost,
      approved_budget: null,
      status: "Pending",
    });
    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit maintenance request." });
  }
});

// GET /api/sc/my-requests -> this caretaker's own maintenance request history
router.get("/my-requests", async (req, res) => {
  const requests = await RequestMaintenance.find({ caretaker: req.user._id });
  res.json({ requests });
});

// ---- Tender Bidding System (Excavation Team): Ahad_23201016 ---------------

// GET /api/sc/tenders -> browse all open (not-expired) tenders, plus any I've bid on
router.get("/tenders", async (req, res) => {
  const tenders = await Tender.find({ status: "Open", deadline: { $gte: new Date() } })
    .populate("site", "name")
    .sort("-createdAt")
    .lean();

  const myBids = await Bid.find({ team: req.user._id }).lean();
  const myBidByTender = Object.fromEntries(myBids.map((b) => [b.tender.toString(), b]));

  const withBidStatus = tenders.map((t) => ({
    ...t,
    myBid: myBidByTender[t._id.toString()] || null,
  }));

  res.json({ tenders: withBidStatus });
});

// GET /api/sc/tenders/:id -> single tender + my bid (if any)
router.get("/tenders/:id", async (req, res) => {
  const tender = await Tender.findById(req.params.id).populate("site", "name");
  if (!tender) return res.status(404).json({ error: "Tender not found." });

  const myBid = await Bid.findOne({ tender: tender._id, team: req.user._id });
  res.json({ tender, myBid });
});

// POST /api/sc/tenders/:id/bid -> submit a bid (cost, timeline, proposal)
router.post("/tenders/:id/bid", async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: "Tender not found." });
    if (tender.status !== "Open" || tender.deadline < new Date()) {
      return res.status(400).json({ error: "This tender is no longer accepting bids." });
    }

    const { cost, timeline, proposal } = req.body;
    if (!cost || !timeline || !proposal) {
      return res.status(400).json({ error: "Cost, timeline, and proposal are required." });
    }

    const existing = await Bid.findOne({ tender: tender._id, team: req.user._id });
    if (existing) {
      return res.status(409).json({ error: "You have already submitted a bid for this tender. Edit it instead." });
    }

    const bid = await Bid.create({
      tender: tender._id,
      team: req.user._id,
      cost,
      timeline,
      proposal,
    });

    res.status(201).json({ bid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit bid." });
  }
});

// PATCH /api/sc/tenders/:id/bid -> edit my bid before the deadline
router.patch("/tenders/:id/bid", async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: "Tender not found." });
    if (tender.status !== "Open" || tender.deadline < new Date()) {
      return res.status(400).json({ error: "This tender is no longer accepting bid changes." });
    }

    const bid = await Bid.findOne({ tender: tender._id, team: req.user._id });
    if (!bid) return res.status(404).json({ error: "You haven't bid on this tender yet." });
    if (bid.status !== "Pending") {
      return res.status(400).json({ error: "This bid has already been decided and can no longer be edited." });
    }

    const { cost, timeline, proposal } = req.body;
    if (cost !== undefined) bid.cost = cost;
    if (timeline !== undefined) bid.timeline = timeline;
    if (proposal !== undefined) bid.proposal = proposal;
    await bid.save();

    res.json({ bid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update bid." });
  }
});

// DELETE /api/sc/tenders/:id/bid -> withdraw my bid before the deadline
router.delete("/tenders/:id/bid", async (req, res) => {
  const tender = await Tender.findById(req.params.id);
  if (!tender) return res.status(404).json({ error: "Tender not found." });
  if (tender.status !== "Open" || tender.deadline < new Date()) {
    return res.status(400).json({ error: "This tender is no longer accepting withdrawals." });
  }

  const bid = await Bid.findOne({ tender: tender._id, team: req.user._id });
  if (!bid) return res.status(404).json({ error: "You haven't bid on this tender." });
  if (bid.status !== "Pending") {
    return res.status(400).json({ error: "This bid has already been decided and can no longer be withdrawn." });
  }

  await Bid.deleteOne({ _id: bid._id });
  res.json({ message: "Bid withdrawn." });
});

// GET /api/sc/my-bids -> every bid this excavation team has submitted, with status
router.get("/my-bids", async (req, res) => {
  const bids = await Bid.find({ team: req.user._id })
    .populate({ path: "tender", select: "title location deadline status estimated_budget" })
    .sort("-createdAt");
  res.json({ bids });
});

module.exports = router;
