const express = require("express");
const Item = require("../models/Item");
const User = require("../models/User");
const ArtifactLoan = require("../models/ArtifactLoan");
const { requireAuth, requireRole } = require("../middleware/auth");
const { notify } = require("../services/notify"); // Role-Based Notification & Reminder System

const router = express.Router();
router.use(requireAuth, requireRole("museum_manager"));

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/loans/museums -> other approved museum authorities, for the "lend from" picker
router.get("/museums", async (req, res) => {
  const museums = await User.find({
    role: "museum_manager",
    status: "approved",
    _id: { $ne: req.user._id },
  }).select("_id name roleProfile.museum_name roleProfile.m_city");
  res.json({ museums });
});

// GET /api/loans/items -> artifact catalogue filtered to a selected museum
router.get("/items", async (req, res) => {
  const { museumName } = req.query;
  const filter = {};

  if (museumName) {
    filter.allocation = "Museum";
    const safeMuseum = escapeRegex(String(museumName));
    filter.$or = [
      { museumName: new RegExp(`^${safeMuseum}$`, "i") },
      { location: new RegExp(`^${safeMuseum}$`, "i") },
    ];
  }

  const items = await Item.find(filter).select("_id name Type site museumName location").populate("site", "name");
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

    // Action-required alert for the lending museum.
    const artifact = await Item.findById(item_id).select("name");
    await notify({
      user: lending_museum_id,
      category: "request",
      type: "loan.request.received",
      title: "New artifact loan request",
      message: `${req.user.roleProfile?.museum_name || req.user.name} asked to borrow "${artifact?.name || "an artifact"}" for ${exhibition_name}.`,
      link: "/mm/incoming-loans",
      actionRequired: true,
      deadlineAt: start_date,
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

  // Approving moves the artifact to "On Loan" and logs it. Remember the old
  // status so the return can restore it.
  if (action === "approve") {
    const artifact = await Item.findById(loan.item);
    if (artifact) {
      loan.previous_availability = artifact.availability;
      artifact.availability = "On Loan";
      artifact.movementHistory.push({
        action: "Loaned out",
        status: "On Loan",
        note: `Approved loan to ${req.user.roleProfile?.museum_name || "another museum"} for "${loan.exhibition_name}"`,
        by: req.user._id,
      });
      await artifact.save();
    }
  }

  await loan.save();

  // Decision back to the requesting museum.
  const artifact = await Item.findById(loan.item).select("name");
  await notify({
    user: loan.requesting_museum,
    category: "request",
    type: action === "approve" ? "loan.request.approved" : "loan.request.declined",
    title: action === "approve" ? "Loan request approved" : "Loan request declined",
    message: `${req.user.roleProfile?.museum_name || req.user.name} ${action === "approve" ? "approved" : "declined"} your request for "${artifact?.name || "an artifact"}".${loan.response_note ? ` Note: ${loan.response_note}` : ""}`,
    link: "/mm/my-loans",
    deadlineAt: action === "approve" ? loan.end_date : null,
  });

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

  // Restore the artifact's earlier status and log the return.
  const returningItem = await Item.findById(loan.item);
  if (returningItem) {
    const restoredStatus = loan.previous_availability || "In Storage";
    returningItem.availability = restoredStatus;
    returningItem.movementHistory.push({
      action: "Returned",
      status: restoredStatus,
      note: `Returned from loan ("${loan.exhibition_name}"); status restored to "${restoredStatus}"`,
      by: req.user._id,
    });
    await returningItem.save();
  }

  await loan.save();

  // Return confirmed, for the borrowing museum's records.
  const returnedItem = await Item.findById(loan.item).select("name");
  await notify({
    user: loan.requesting_museum,
    category: "request",
    type: "loan.returned",
    title: "Artifact loan closed",
    message: `"${returnedItem?.name || "The borrowed artifact"}" has been marked as returned by the lending museum.`,
    link: "/mm/my-loans",
  });

  res.json({ message: "Artifact marked as returned.", loan });
});

module.exports = router;