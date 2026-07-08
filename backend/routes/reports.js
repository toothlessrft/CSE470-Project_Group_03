const express = require("express");
const DiscoveryReport = require("../models/DiscoveryReport");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Any logged-in user, regardless of role, can log a discovery.
router.use(requireAuth);

// POST /api/reports  -> log a newly discovered artifact
router.post("/", async (req, res) => {
  try {
    const { lat, lng, address, material, images, notes, contact_email, contact_phone } = req.body;

    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      return res.status(400).json({ error: "Please pick the discovery location on the map." });
    }
    if (!material || !contact_email || !contact_phone) {
      return res
        .status(400)
        .json({ error: "Material and contact info (email and phone) are required." });
    }

    const report = await DiscoveryReport.create({
      reporter: req.user._id,
      location: { lat, lng, address },
      material,
      images: Array.isArray(images) ? images.slice(0, 6) : [],
      notes,
      contact_email,
      contact_phone,
    });

    res.status(201).json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit discovery report." });
  }
});

// GET /api/reports/mine -> reports the current user has submitted, with status
router.get("/mine", async (req, res) => {
  const reports = await DiscoveryReport.find({ reporter: req.user._id })
    .populate("assignment.researcher", "name nid email")
    .sort("-createdAt");
  res.json({ reports });
});

module.exports = router;
