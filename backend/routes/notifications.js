// Read side of the notification system - the bell panel and its counts.
const express = require("express");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");
const { ensureDemoNotifications } = require("../services/sampleNotifications");
const { ensureReviewRequestNotifications } = require("../services/reviewNotifications");

const router = express.Router();
router.use(requireAuth);

// Nothing older than this is worth keeping in the panel.
const MAX_RETURNED = 200;

// GET /api/notifications?category=auction&unread=true&limit=50 -> the inbox.
// Action-required items float to the top of each page, then newest first.
router.get("/", async (req, res) => {
  try {
    const { category, unread, limit } = req.query;

    const filter = { user: req.user._id };
    if (category && category !== "all") filter.category = category;
    if (unread === "true") filter.read = false;

    await ensureDemoNotifications(req.user);
    await ensureReviewRequestNotifications(req.user);

    const notifications = await Notification.find(filter)
      .sort({ action_required: -1, read: 1, createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, MAX_RETURNED));

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load notifications." });
  }
});

// GET /api/notifications/summary -> the bell count and the admin card badges.
router.get("/summary", async (req, res) => {
  try {
    await ensureDemoNotifications(req.user);
    await ensureReviewRequestNotifications(req.user);

    const rows = await Notification.aggregate([
      { $match: { user: req.user._id, read: false } },
      {
        $group: {
          _id: { category: "$category", dashboard_key: "$dashboard_key" },
          count: { $sum: 1 },
          action_required: { $sum: { $cond: ["$action_required", 1, 0] } },
        },
      },
    ]);

    const byCategory = {};
    const byDashboardKey = {};
    let unread = 0;
    let actionRequired = 0;
    // Unread items filed under no dashboard card, so they still get counted.
    let unkeyed = 0;

    for (const row of rows) {
      const { category, dashboard_key: key } = row._id;
      byCategory[category] = (byCategory[category] || 0) + row.count;
      if (key) byDashboardKey[key] = (byDashboardKey[key] || 0) + row.count;
      else unkeyed += row.count;
      unread += row.count;
      actionRequired += row.action_required;
    }

    res.json({ unread, action_required: actionRequired, byCategory, byDashboardKey, unkeyed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load notification summary." });
  }
});

// POST /api/notifications/:id/read
router.post("/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true, read_at: new Date() },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: "Notification not found." });
  res.json({ notification });
});

// POST /api/notifications/:id/unread -> lets a user park something for later
router.post("/:id/unread", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: false, read_at: null },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: "Notification not found." });
  res.json({ notification });
});

// POST /api/notifications/read-all  { category? }
router.post("/read-all", async (req, res) => {
  const filter = { user: req.user._id, read: false };
  if (req.body?.category && req.body.category !== "all") filter.category = req.body.category;

  const result = await Notification.updateMany(filter, { read: true, read_at: new Date() });
  res.json({ message: "Marked as read.", modified: result.modifiedCount });
});

// POST /api/notifications/read-by-key  { key } -> opening an admin dashboard
// card clears its badge by marking everything under that key as read.
router.post("/read-by-key", async (req, res) => {
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: "A dashboard key is required." });

  const result = await Notification.updateMany(
    { user: req.user._id, dashboard_key: key, read: false },
    { read: true, read_at: new Date() }
  );
  res.json({ message: "Marked as read.", modified: result.modifiedCount });
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) return res.status(404).json({ error: "Notification not found." });
  res.json({ message: "Notification dismissed." });
});

module.exports = router;
