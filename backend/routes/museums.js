const express = require("express");
const Item = require("../models/Item");
const User = require("../models/User");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();
router.use(optionalAuth);

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AVAILABILITY_STATUSES = ["On Display", "In Storage", "Under Conservation", "On Loan", "Transferred"];

function emptyCounts() {
  const counts = { total: 0 };
  for (const s of AVAILABILITY_STATUSES) counts[s] = 0;
  return counts;
}

// Every approved museum authority account + how many artifacts they hold,
// broken down by availability status.
async function buildDirectory() {
  const managers = await User.find({
    role: "museum_manager",
    status: "approved",
    "roleProfile.museum_name": { $exists: true, $ne: "" },
  }).select(
    "name roleProfile.museum_name roleProfile.address roleProfile.location roleProfile.operating_hours roleProfile.ticket_info"
  );

  const counts = await Item.aggregate([
    { $match: { allocation: "Museum", museumName: { $ne: "" } } },
    { $group: { _id: { museumName: "$museumName", availability: "$availability" }, count: { $sum: 1 } } },
  ]);

  const countsByMuseum = {};
  for (const c of counts) {
    const name = c._id.museumName;
    if (!countsByMuseum[name]) countsByMuseum[name] = emptyCounts();
    const status = c._id.availability || "In Storage";
    countsByMuseum[name][status] = (countsByMuseum[name][status] || 0) + c.count;
    countsByMuseum[name].total += c.count;
  }

  return managers.map((m) => {
    const name = m.roleProfile?.museum_name;
    const stats = countsByMuseum[name] || emptyCounts();
    return {
      museum_name: name,
      address: m.roleProfile?.address || "",
      location: m.roleProfile?.location?.lat != null ? m.roleProfile.location : null,
      operating_hours: m.roleProfile?.operating_hours || "",
      ticket_info: m.roleProfile?.ticket_info || "",
      artifact_counts: stats,
    };
  });
}

// GET /api/museums -> full directory, alphabetical
router.get("/", async (req, res) => {
  const directory = await buildDirectory();
  directory.sort((a, b) => a.museum_name.localeCompare(b.museum_name));
  res.json({ museums: directory });
});

// GET /api/museums/nearby?lat=&lng=&radius_km= -> used by the Near Me page
router.get("/nearby", async (req, res) => {
  const { lat, lng, radius_km } = req.query;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: "lat and lng are required." });
  }
  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  const radius = parseFloat(radius_km) || 50;

  const directory = await buildDirectory();
  const withDistance = directory
    .filter((m) => m.location?.lat != null && m.location?.lng != null)
    .map((m) => ({ ...m, distance_km: haversineKm(centerLat, centerLng, m.location.lat, m.location.lng) }))
    .filter((m) => m.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json({ museums: withDistance });
});

// GET /api/museums/:museumName -> profile + artifacts
// Search & filter (Feature 12): ?availability=&type=&civilization=&era=&material=&location=&q=
router.get("/:museumName", async (req, res) => {
  const museumName = decodeURIComponent(req.params.museumName);
  const manager = await User.findOne({
    role: "museum_manager",
    status: "approved",
    "roleProfile.museum_name": museumName,
  }).select(
    "name roleProfile.museum_name roleProfile.address roleProfile.location roleProfile.operating_hours roleProfile.ticket_info"
  );

  if (!manager) return res.status(404).json({ error: "Museum not found." });

  const { availability, type, civilization, era, material, location, q } = req.query;

  // Owns it outright, OR currently has it on an approved loan from elsewhere.
  const ownership = {
    $or: [
      { allocation: "Museum", museumName },
      { allocation: "Museum", on_loan_to: museumName },
    ],
  };

  const extra = {};
  if (availability) extra.availability = availability;
  if (type) extra.Type = type;
  if (civilization) extra.civilization = new RegExp(civilization.trim(), "i");
  if (era) extra.era = new RegExp(era.trim(), "i");
  if (material) extra.material = new RegExp(material.trim(), "i");
  if (location) extra.location = new RegExp(location.trim(), "i");
  if (q) {
    const safeQ = q.trim();
    extra.$or = [{ name: new RegExp(safeQ, "i") }, { artifactId: new RegExp(safeQ, "i") }];
  }

  const items = await Item.find({ $and: [ownership, extra] })
    .select("name artifactId Type picture description civilization era region material usage availability location museumName")
    .sort({ availability: 1, name: 1 });

  res.json({
    museum: {
      museum_name: manager.roleProfile.museum_name,
      address: manager.roleProfile?.address || "",
      location: manager.roleProfile?.location?.lat != null ? manager.roleProfile.location : null,
      operating_hours: manager.roleProfile?.operating_hours || "",
      ticket_info: manager.roleProfile?.ticket_info || "",
    },
    items,
  });
});

module.exports = router;