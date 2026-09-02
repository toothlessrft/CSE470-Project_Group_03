const express = require("express");
const mongoose = require("mongoose");
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

function toExactMatch(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return null;
  return new RegExp(`^${cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
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

  const counts = await Item.aggregate([
    { $match: { pending_allocation: { $ne: true } } }, // Ahad_23201016
    { $group: { _id: "$site", count: { $sum: 1 } } },
  ]);
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
// query params: id, civilization, era, region, material, usage, q, site, lat, lng, radius_km
router.get("/artifacts", async (req, res) => {
  const { id, civilization, era, region, material, usage, q, site, lat, lng, radius_km, museumName, location } = req.query;

  // Ahad_23201016 - finds from an active dig stay out of the catalogue until
  // the admin allocates them.
  const filter = { pending_allocation: { $ne: true } };

  // Single record, e.g. opening a match from the AI identifier. A bad id
  // returns nothing rather than a cast error.
  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ count: 0, limited: !req.user, results: [] });
    }
    filter._id = id;
  }

  if (civilization) filter.civilization = toRegex(civilization);
  if (era) filter.era = toRegex(era);
  if (region) filter.region = toRegex(region);
  if (material) filter.material = toRegex(material);
  if (usage) filter.usage = toRegex(usage);
  if (site) filter.site = site;

  const exactMuseumFilters = [];
  const locationFilters = [];

  if (museumName) {
    filter.allocation = "Museum";
    exactMuseumFilters.push(
      { museumName: toExactMatch(museumName) },
      { location: toExactMatch(museumName) }
    );
  }

  if (location) {
    locationFilters.push(
      { museumName: toExactMatch(location) },
      { location: toExactMatch(location) }
    );
  }

  if (exactMuseumFilters.length > 0 && locationFilters.length > 0) {
    filter.$and = [
      { $or: exactMuseumFilters },
      { $or: locationFilters },
    ];
  } else if (exactMuseumFilters.length > 0) {
    filter.$or = [...(filter.$or || []), ...exactMuseumFilters];
  } else if (locationFilters.length > 0) {
    filter.$or = [...(filter.$or || []), ...locationFilters];
  }

  if (q) {
    const rx = toRegex(q);
    const matchingSites = await Site.find({ name: rx }).select("_id");
    const textMatches = [
      { name: rx },
      { description: rx },
      { civilization: rx },
      { era: rx },
      { region: rx },
      { material: rx },
      { usage: rx },
      { Type: rx },
      { site: { $in: matchingSites.map((s) => s._id) } },
      { location: rx },
      { museumName: rx },
    ];
    filter.$or = [...(filter.$or || []), ...textMatches];
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
      // Guests get a teaser only, no exact provenance
      return { ...base, limited: true };
    }

    // Logged-in users get the full record
    return {
      ...base,
      limited: false,
      discovery_date: i.discovery_date,
      location: i.location,
      allocation: i.allocation,
      museumName: i.museumName,
      district: i.site?.s_district,
      thana: i.site?.s_thana,
      latitude: i.site?.latitude,
      longitude: i.site?.longitude,
      specialization: i.specialization,
    };
  });

  res.json({ count: results.length, limited: !isLoggedIn, results });
});

module.exports = router;
