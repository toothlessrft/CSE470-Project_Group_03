const express = require("express");
const Item = require("../models/Item");
const User = require("../models/User");
const ArtifactLoan = require("../models/ArtifactLoan");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("museum_manager"));

// GET /api/loans/museums -> other approved museum authorities, for the "lend from" picker
router.get("/museums", async (req, res) => {
  const museums = await User.find({
    role: "museum_manager",
    status: "approved",
    _id: { $ne: req.user._id },
  }).select("_id name roleProfile.museum_name roleProfile.m_city");
  res.json({ museums });
});

// GET /api/loans/items -> artifact catalogue, for the "which item" picker
router.get("/items", async (req, res) => {
  const items = await Item.find().select("_id name Type site").populate("site", "name");
  res.json({ items });
});

// POST /api/loans/request -> requesting museum asks another museum for a loan
router.post("/request", async (req, res) => {
  try {
    const { lending_museum_id, item_id, exhibition_name, purpose, start_date, end_date } = req.body;

    if (!lending_museum_id || !item_id || !exhibition_name || !purpose || !start_date || !end_date) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (lending_museum_id === String(req.user._id)) {
      return res.status(400).json({ error: "You cannot request a loan from your own museum." });
    }
    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ error: "End date must be after the start date." });
    }

    const lender = await User.findOne({ _id: lending_museum_id, role: "museum_manager" });
    if (!lender) return res.status(404).json({ error: "Lending museum not found." });

    const loan = await ArtifactLoan.create({
      requesting_museum: req.user._id,
      lending_museum: lending_museum_id,
      item: item_id,
      exhibition_name,
      purpose,
      start_date,
      end_date,
      status: "Pending",
    });

    res.status(201).json({ loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit loan request." });
  }
});

// GET /api/loans/outgoing -> loan requests this museum has made to others
router.get("/outgoing", async (req, res) => {
  const loans = await ArtifactLoan.find({ requesting_museum: req.user._id })
    .populate("lending_museum", "name roleProfile.museum_name")
    .populate("item", "name Type")
    .sort("-request_date");
  res.json({ loans });
});

// GET /api/loans/incoming -> loan requests other museums have made to this museum
// optional ?status=Pending|Approved|Declined|Returned filter
router.get("/incoming", async (req, res) => {
  const filter = { lending_museum: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const loans = await ArtifactLoan.find(filter)
    .populate("requesting_museum", "name roleProfile.museum_name")
    .populate("item", "name Type")
    .sort("-request_date");
  res.json({ loans });
});

// POST /api/loans/:id/decision -> lending museum approves or declines a pending request
router.post("/:id/decision", async (req, res) => {
  const { action, response_note } = req.body;
  if (!["approve", "decline"].includes(action)) {
    return res.status(400).json({ error: "Unknown action." });
  }

  const loan = await ArtifactLoan.findOne({ _id: req.params.id, lending_museum: req.user._id });
  if (!loan) return res.status(404).json({ error: "Loan request not found." });
  if (loan.status !== "Pending") {
    return res.status(400).json({ error: "This request has already been decided." });
  }

  loan.status = action === "approve" ? "Approved" : "Declined";
  loan.response_note = response_note || "";
  loan.decided_at = new Date();
  await loan.save();

  res.json({ message: `Loan request ${loan.status.toLowerCase()}.`, loan });
});

// POST /api/loans/:id/return -> lending museum marks an approved loan as returned
router.post("/:id/return", async (req, res) => {
  const loan = await ArtifactLoan.findOne({ _id: req.params.id, lending_museum: req.user._id });
  if (!loan) return res.status(404).json({ error: "Loan request not found." });
  if (loan.status !== "Approved") {
    return res.status(400).json({ error: "Only approved (active) loans can be marked returned." });
  }

  loan.status = "Returned";
  loan.returned_at = new Date();
  await loan.save();

  res.json({ message: "Artifact marked as returned.", loan });
});

module.exports = router;
