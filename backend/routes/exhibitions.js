const express = require("express");
const Exhibition = require("../models/Exhibition");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Everything here is public - anyone can browse published exhibitions,
// educational tours, and cultural events, no account required.
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

const PUBLIC_FIELDS =
  "title type description image location start_date end_date start_time end_time capacity ticket_info contact museum_name status createdAt";

// GET /api/exhibitions -> published listings, optionally filtered
// query params: type, upcoming (=true to hide ones that already ended), limit
router.get("/", async (req, res) => {
  const { type, upcoming, limit } = req.query;

  const filter = { status: "published" };
  if (type) filter.type = type;
  if (upcoming === "true") filter.end_date = { $gte: new Date() };

  const exhibitions = await Exhibition.find(filter)
    .select(PUBLIC_FIELDS)
    .sort({ start_date: 1 })
    .limit(limit ? Math.min(parseInt(limit, 10) || 50, 200) : 100);

  res.json({ exhibitions });
});

// GET /api/exhibitions/nearby?lat=&lng=&radius_km= -> published listings near a point,
// used by the "Near Me" experience (browser geolocation).
router.get("/nearby", async (req, res) => {
  const { lat, lng, radius_km } = req.query;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: "lat and lng are required." });
  }

  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  const radius = parseFloat(radius_km) || 50;

  const exhibitions = await Exhibition.find({
    status: "published",
    "location.lat": { $ne: null },
    "location.lng": { $ne: null },
    end_date: { $gte: new Date() },
  }).select(PUBLIC_FIELDS + " location");

  const withDistance = exhibitions
    .map((e) => ({
      ...e.toObject(),
      distance_km: haversineKm(centerLat, centerLng, e.location.lat, e.location.lng),
    }))
    .filter((e) => e.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json({ exhibitions: withDistance });
});

// GET /api/exhibitions/:id -> a single published listing's full details
router.get("/:id", async (req, res) => {
  const exhibition = await Exhibition.findOne({ _id: req.params.id, status: "published" }).select(
    PUBLIC_FIELDS + " location site"
  );
  if (!exhibition) return res.status(404).json({ error: "Exhibition not found." });
  res.json({ exhibition });
});

module.exports = router;