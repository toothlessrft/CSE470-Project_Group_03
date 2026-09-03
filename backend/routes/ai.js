// Upload a photo -> suggested civilization, type, era and material, plus the
// closest matches already catalogued. Advisory only; nothing here writes an Item.
const express = require("express");
const Item = require("../models/Item");
const { requireAuth } = require("../middleware/auth");
const { identifyArtifact } = require("../services/artifactAI");

const router = express.Router();

// Identification costs a paid API call, so it stays behind a login.
router.use(requireAuth);

// In-memory throttle, enough to stop a retry loop burning the API budget.
// Resets on restart.
const RATE_LIMIT = 10; // identifications
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour, per user
const recentCalls = new Map(); // userId -> number[] of timestamps

function rateLimited(userId) {
  const now = Date.now();
  const key = String(userId);
  const calls = (recentCalls.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (calls.length >= RATE_LIMIT) {
    recentCalls.set(key, calls);
    return true;
  }
  calls.push(now);
  recentCalls.set(key, calls);
  return false;
}

function toRegex(value) {
  return new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

// Catalogue artifacts sharing tags with the suggestion, ranked by how many.
// Same visibility rule as the search: pending-allocation finds stay out.
async function findSimilar(suggestion) {
  const tagFields = ["civilization", "era", "region", "material", "usage"];
  const tags = tagFields
    .map((field) => [field, String(suggestion[field] || "").trim()])
    .filter(([, value]) => value !== "");

  const conditions = tags.map(([field, value]) => ({ [field]: toRegex(value) }));
  if (suggestion.Type && suggestion.Type !== "other") {
    conditions.push({ Type: suggestion.Type });
  }
  if (conditions.length === 0) return [];

  const candidates = await Item.find({
    pending_allocation: { $ne: true },
    $or: conditions,
  })
    .populate("site", "name s_district")
    .limit(100);

  return candidates
    .map((item) => {
      const matched = tags
        .filter(([field, value]) => toRegex(value).test(String(item[field] || "")))
        .map(([field]) => field);
      if (suggestion.Type && suggestion.Type !== "other" && item.Type === suggestion.Type) {
        matched.push("type");
      }
      return {
        _id: item._id,
        name: item.name,
        Type: item.Type,
        picture: item.picture,
        civilization: item.civilization,
        era: item.era,
        region: item.region,
        material: item.material,
        usage: item.usage,
        site_name: item.site?.name,
        district: item.site?.s_district,
        matched_on: matched,
      };
    })
    .sort((a, b) => b.matched_on.length - a.matched_on.length)
    .slice(0, 8);
}

// POST /api/ai/identify  { image: <data URL>, hint?: string }
router.post("/identify", async (req, res) => {
  try {
    if (rateLimited(req.user._id)) {
      return res
        .status(429)
        .json({ error: "You have reached the identification limit for this hour. Try again later." });
    }

    const suggestion = await identifyArtifact({ image: req.body?.image, hint: req.body?.hint });

    // Nothing to match on if the model could not read the photo.
    const similar = suggestion.identifiable ? await findSimilar(suggestion) : [];

    res.json({ suggestion, similar });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("AI identification failed:", err);
    res.status(502).json({ error: "Could not identify this image right now. Please try again." });
  }
});

module.exports = router;
