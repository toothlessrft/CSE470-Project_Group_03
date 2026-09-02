// Ahad_23201016 - Excavation Team: tenders, bids and awarded projects.
const express = require("express");
const Tender = require("../models/Tender");
const TenderBid = require("../models/TenderBid");
const ExcavationProject = require("../models/ExcavationProject");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("excavation_team"));

// GET /api/et/dashboard
// The account represents a company; `name` is that company's representative.
router.get("/dashboard", async (req, res) => {
  const [openTenders, activeBids, ongoingProjects, completedProjects] = await Promise.all([
    Tender.countDocuments({ status: "Open", deadline: { $gt: new Date() } }),
    TenderBid.countDocuments({ team: req.user._id, status: "Pending" }),
    ExcavationProject.countDocuments({ excavation_team: req.user._id, end_date: null }),
    ExcavationProject.countDocuments({ excavation_team: req.user._id, end_date: { $ne: null } }),
  ]);

  res.json({
    team: {
      nid: req.user.nid,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      profile_pic: req.user.profile_pic,
      company_name:
        req.user.roleProfile?.company_name || req.user.roleProfile?.organization || "",
      representative_designation: req.user.roleProfile?.representative_designation || "",
      team_size: req.user.roleProfile?.team_size ?? null,
    },
    stats: {
      open_tenders: openTenders,
      pending_bids: activeBids,
      active_projects: ongoingProjects,
      completed_projects: completedProjects,
    },
  });
});

module.exports = router;
