const express = require("express");
const Item = require("../models/Item");
const Site = require("../models/Site");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Everything here is public. optionalAuth just tells us whether to send the
// full record (registered/logged-in users) or a trimmed preview (guests).
router.use(optionalAuth);

function toRegex(value) {
  // simple case-insensitive "contains" match, safe against regex injection
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/search/filters -> distinct values to populate the dropdowns
router.get("/filters", async (req, res) => {
  const [civilization, era, region, material, usage] = await Promise.all([
    Item.distinct("civilization"),
    Item.distinct("era"),
    Item.distinct("region"),
    Item.distinct("material"),
    Item.distinct("usage"),
  ]);
  res.json({
    civilizations: civilization.filter(Boolean).sort(),
    eras: era.filter(Boolean).sort(),
    regions: region.filter(Boolean).sort(),
    materials: material.filter(Boolean).sort(),
    usages: usage.filter(Boolean).sort(),
  });
});

// GET /api/search/map -> sites with known coordinates + how many artifacts each holds
router.get("/map", async (req, res) => {
  const sites = await Site.find({ latitude: { $ne: null }, longitude: { $ne: null } }).select(
    "name era s_district s_thana latitude longitude"
  );

  const counts = await Item.aggregate([{ $group: { _id: "$site", count: { $sum: 1 } } }]);
  const countBySite = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.json({
    sites: sites.map((s) => ({
      _id: s._id,
      name: s.name,
      era: s.era,
      district: s.s_district,
      thana: s.s_thana,
      latitude: s.latitude,
      longitude: s.longitude,
      artifact_count: countBySite[String(s._id)] || 0,
    })),
  });
});

// GET /api/search/artifacts -> the main search
// query params: civilization, era, region, material, usage, q, site, lat, lng, radius_km
router.get("/artifacts", async (req, res) => {
  const { civilization, era, region, material, usage, q, site, lat, lng, radius_km } = req.query;

  const filter = {};
  if (civilization) filter.civilization = toRegex(civilization);
  if (era) filter.era = toRegex(era);
  if (region) filter.region = toRegex(region);
  if (material) filter.material = toRegex(material);
  if (usage) filter.usage = toRegex(usage);
  if (site) filter.site = site;
  if (q) {
    const rx = toRegex(q);
    const matchingSites = await Site.find({ name: rx }).select("_id");
    filter.$or = [
      { name: rx },
      { description: rx },
      { civilization: rx },
      { era: rx },
      { region: rx },
      { material: rx },
      { usage: rx },
      { Type: rx },
      { site: { $in: matchingSites.map((s) => s._id) } },
    ];
  }

  let items = await Item.find(filter).populate("site", "name s_district s_thana latitude longitude era").limit(200);

  // Optional radius filter around a map point (Location search mode)
  if (lat && lng && radius_km) {
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const radius = parseFloat(radius_km);
    items = items.filter((i) => {
      if (i.site?.latitude == null || i.site?.longitude == null) return false;
      return haversineKm(centerLat, centerLng, i.site.latitude, i.site.longitude) <= radius;
    });
  }

  const isLoggedIn = !!req.user;

  const results = items.map((i) => {
    const base = {
      _id: i._id,
      name: i.name,
      Type: i.Type,
      picture: i.picture,
      civilization: i.civilization,
      era: i.era,
      region: i.region,
      material: i.material,
      usage: i.usage,
      site_name: i.site?.name,
      description: isLoggedIn ? i.description : (i.description || "").slice(0, 120),
    };

    if (!isLoggedIn) {
      // Knowledge hub: guests get a teaser only, no exact provenance data
      return { ...base, limited: true };
    }

    // Logged-in users (any role) get the full record
    return {
      ...base,
      limited: false,
      discovery_date: i.discovery_date,
      location: i.location,
      district: i.site?.s_district,
      thana: i.site?.s_thana,
      specialization: i.specialization,
    };
  });

  res.json({ count: results.length, limited: !isLoggedIn, results });
});

module.exports = router;
