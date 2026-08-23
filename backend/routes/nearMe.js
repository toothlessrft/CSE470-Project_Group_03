const express = require("express");
const Site = require("../models/Site");
const Item = require("../models/Item");
const Exhibition = require("../models/Exhibition");
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

// GET /api/near-me?lat=&lng=&radius_km= -> archaeological sites, upcoming
// exhibitions/tours/events, and museums, all within radius_km of the point.
router.get("/", async (req, res) => {
  const { lat, lng, radius_km } = req.query;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: "lat and lng are required." });
  }
  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  const radius = parseFloat(radius_km) || 50;

  // --- Archaeological sites ---
  const sites = await Site.find({ latitude: { $ne: null }, longitude: { $ne: null } }).select(
    "name era s_district s_thana latitude longitude"
  );
  const siteCounts = await Item.aggregate([
    { $match: { pending_allocation: { $ne: true } } },
    { $group: { _id: "$site", count: { $sum: 1 } } },
  ]);
  const countBySite = Object.fromEntries(siteCounts.map((c) => [String(c._id), c.count]));

  const nearbySites = sites
    .map((s) => ({
      _id: s._id,
      name: s.name,
      era: s.era,
      district: s.s_district,
      thana: s.s_thana,
      latitude: s.latitude,
      longitude: s.longitude,
      artifact_count: countBySite[String(s._id)] || 0,
      distance_km: haversineKm(centerLat, centerLng, s.latitude, s.longitude),
    }))
    .filter((s) => s.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  // --- Exhibitions / educational tours / cultural events ---
  const exhibitions = await Exhibition.find({
    status: "published",
    "location.lat": { $ne: null },
    "location.lng": { $ne: null },
    end_date: { $gte: new Date() },
  }).select(
    "title type description image location start_date end_date start_time end_time ticket_info contact museum_name"
  );

  const nearbyExhibitions = exhibitions
    .map((e) => ({
      ...e.toObject(),
      distance_km: haversineKm(centerLat, centerLng, e.location.lat, e.location.lng),
    }))
    .filter((e) => e.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  // --- Museums: branches/locations + artifact overview + ticket & hours ---
  const managers = await User.find({
    role: "museum_manager",
    status: "approved",
    "roleProfile.location.lat": { $ne: null },
    "roleProfile.location.lng": { $ne: null },
  }).select(
    "roleProfile.museum_name roleProfile.address roleProfile.location roleProfile.operating_hours roleProfile.ticket_info"
  );

  const museumNames = managers.map((m) => m.roleProfile.museum_name).filter(Boolean);
  const itemCounts = await Item.aggregate([
    { $match: { allocation: "Museum", museumName: { $in: museumNames } } },
    { $group: { _id: "$museumName", count: { $sum: 1 } } },
  ]);
  const countByMuseum = Object.fromEntries(itemCounts.map((c) => [c._id, c.count]));

  const nearbyMuseums = managers
    .map((m) => ({
      museum_name: m.roleProfile.museum_name,
      address: m.roleProfile.address || "",
      location: m.roleProfile.location,
      operating_hours: m.roleProfile.operating_hours || "",
      ticket_info: m.roleProfile.ticket_info || "",
      artifact_count: countByMuseum[m.roleProfile.museum_name] || 0,
      distance_km: haversineKm(centerLat, centerLng, m.roleProfile.location.lat, m.roleProfile.location.lng),
    }))
    .filter((m) => m.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json({ sites: nearbySites, exhibitions: nearbyExhibitions, museums: nearbyMuseums });
});

module.exports = router;