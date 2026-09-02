const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const ExcavationProject = require("../models/ExcavationProject");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Who the current user would be reviewing on a given project, and whether
// they already have.
async function resolveReviewContext(project, userId) {
  const leadId = String(project.lead_archaeologist?._id || project.lead_archaeologist || "");
  const teamId = String(project.excavation_team?._id || project.excavation_team || "");
  const uid = String(userId);

  if (uid === leadId) {
    return { reviewerRole: "archaeologist", revieweeId: project.excavation_team, isParticipant: true };
  }
  if (uid === teamId) {
    return { reviewerRole: "excavation_team", revieweeId: project.lead_archaeologist, isParticipant: true };
  }
  return { isParticipant: false };
}

// GET /api/reviews/project/:projectId -> who this user should rate here, and
// whether they already have, so the popup can show a thank-you instead.
router.get("/project/:projectId", async (req, res) => {
  const project = await ExcavationProject.findById(req.params.projectId)
    .populate("lead_archaeologist", "name")
    .populate("excavation_team", "name roleProfile.company_name");
  if (!project) return res.status(404).json({ error: "Project not found." });

  const { reviewerRole, revieweeId, isParticipant } = await resolveReviewContext(project, req.user._id);
  if (!isParticipant) return res.status(403).json({ error: "You are not part of this excavation project." });

  if (!project.end_date) {
    return res.status(400).json({ error: "This project hasn't been completed yet." });
  }

  const reviewee = reviewerRole === "archaeologist" ? project.excavation_team : project.lead_archaeologist;
  const revieweeName = reviewerRole === "archaeologist" ? reviewee?.roleProfile?.company_name || reviewee?.name : reviewee?.name;

  const existing = await Review.findOne({ project: project._id, reviewer: req.user._id });

  res.json({
    project: { _id: project._id, p_name: project.p_name },
    reviewee_id: revieweeId,
    reviewee_name: revieweeName || "your partner",
    reviewer_role: reviewerRole,
    already_reviewed: Boolean(existing),
    my_review: existing,
  });
});

// POST /api/reviews/project/:projectId   { rating, feedback }
router.post("/project/:projectId", async (req, res) => {
  try {
    const project = await ExcavationProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found." });

    const { reviewerRole, revieweeId, isParticipant } = await resolveReviewContext(project, req.user._id);
    if (!isParticipant) return res.status(403).json({ error: "You are not part of this excavation project." });
    if (!project.end_date) return res.status(400).json({ error: "This project hasn't been completed yet." });

    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const review = await Review.create({
      project: project._id,
      reviewer: req.user._id,
      reviewee: revieweeId,
      reviewer_role: reviewerRole,
      rating,
      feedback: (req.body.feedback || "").trim(),
    });

    // Retire the prompt - nothing else would ever clear its badge.
    await Notification.updateMany(
      { user: req.user._id, type: "review.requested", "meta.project": project._id, read: false },
      { read: true, read_at: new Date(), action_required: false }
    );

    res.status(201).json({ message: "Thanks for your feedback!", review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "You've already reviewed this project." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not submit review." });
  }
});

// GET /api/reviews/ratings?ids=id1,id2 -> batch average and count, for showing
// "★ 4.3 (12)" beside a list of names.
router.get("/ratings", async (req, res) => {
  const ids = (req.query.ids || "").split(",").filter(Boolean);
  if (ids.length === 0) return res.json({ ratings: {} });

  const rows = await Review.aggregate([
    { $match: { reviewee: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: "$reviewee", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const ratings = Object.fromEntries(
    rows.map((r) => [String(r._id), { average: Math.round(r.average * 10) / 10, count: r.count }])
  );
  res.json({ ratings });
});

// GET /api/reviews/history/:userId -> full review history for one person
router.get("/history/:userId", async (req, res) => {
  const isSelf = String(req.user._id) === req.params.userId;
  if (!isSelf && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only view your own review history." });
  }

  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate("reviewer", "name roleProfile.company_name")
    .populate("project", "p_name")
    .sort({ createdAt: -1 });

  const average =
    reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : null;

  res.json({
    average,
    count: reviews.length,
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      feedback: r.feedback,
      reviewer_name: r.reviewer?.roleProfile?.company_name || r.reviewer?.name || "Unknown",
      reviewer_role: r.reviewer_role,
      project_name: r.project?.p_name || "Unknown project",
      createdAt: r.createdAt,
    })),
  });
});

module.exports = router;
