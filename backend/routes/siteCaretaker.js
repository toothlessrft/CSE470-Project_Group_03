const express = require("express");
const Site = require("../models/Site");
const RequestMaintenance = require("../models/RequestMaintenance");
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

module.exports = router;
