const express = require("express");
const Site = require("../models/Site");
const Item = require("../models/Item");
const ItemRequest = require("../models/ItemRequest");
const Exhibition = require("../models/Exhibition");
const { MUSEUMS, normalizeMuseumName } = require("../config/museums");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const { notifyMany, notifyAdmins } = require("../services/notify"); // Role-Based Notification & Reminder System

const router = express.Router();
router.use(requireAuth, requireRole("museum_manager"));

// Nearby exhibition / event alerts -----------------------------------------
// Members carry an optional home location on their profile; anyone inside this
// radius of a newly published listing gets told about it.
const NEARBY_RADIUS_KM = 50;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Announce a newly published exhibition. Members with a home location inside
 * NEARBY_RADIUS_KM get a "near you" alert; everyone else who is a general
 * member still gets the plain new-event notice, so the Events tab is never
 * empty just because someone never set a location.
 */
async function announceExhibition(exhibition, actorId) {
  try {
    if (exhibition.status !== "published") return;

    const audience = await User.find({
      status: "approved",
      role: { $in: ["public", "archaeologist", "museum_manager", "excavation_team"] },
    }).select("_id roleProfile.location");

    const venue = exhibition.museum_name || exhibition.location?.address || "a nearby venue";
    const when = new Date(exhibition.start_date).toLocaleDateString();
    const hasCoords = exhibition.location?.lat != null && exhibition.location?.lng != null;

    const near = [];
    const rest = [];
    for (const user of audience) {
      const loc = user.roleProfile?.location;
      const isNear =
        hasCoords &&
        loc?.lat != null &&
        loc?.lng != null &&
        haversineKm(exhibition.location.lat, exhibition.location.lng, loc.lat, loc.lng) <= NEARBY_RADIUS_KM;
      (isNear ? near : rest).push(user._id);
    }

    await notifyMany(
      near,
      {
        category: "event",
        type: "exhibition.nearby",
        title: "New event near you",
        message: `"${exhibition.title}" opens ${when} at ${venue}.`,
        link: "/exhibitions",
        deadlineAt: exhibition.start_date,
      },
      [actorId]
    );

    await notifyMany(
      rest,
      {
        category: "event",
        type: "exhibition.published",
        title: "New exhibition announced",
        message: `"${exhibition.title}" at ${venue} runs from ${when}.`,
        link: "/exhibitions",
        deadlineAt: exhibition.start_date,
      },
      [actorId]
    );
  } catch (err) {
    console.error("[exhibitions] could not send event notifications:", err.message);
  }
}

// GET /api/mm/dashboard  (was /m_mangaer/dashboard)
router.get("/dashboard", async (req, res) => {
  res.json({
    m_manager: {
      nid: req.user.nid,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      profile_pic: req.user.profile_pic,
      museum_name: req.user.roleProfile?.museum_name,
      m_city: req.user.roleProfile?.m_city,
      m_street: req.user.roleProfile?.m_street,
    },
  });
});

// GET /api/mm/sites -> all sites, for the site-picker
router.get("/sites", async (req, res) => {
  const sites = await Site.find().select("_id name era");
  res.json({ sites });
});

// GET /api/mm/sites/:siteId/items -> items discovered at a given site
router.get("/sites/:siteId/items", async (req, res) => {
  const items = await Item.find({ site: req.params.siteId }).select("_id name Type");
  res.json({ items });
});

// Museum-scoped artifact access: only artifacts assigned to this manager's museum.
router.get("/my-museum-items", async (req, res) => {
  const museumName = normalizeMuseumName(req.user.roleProfile?.museum_name);
  if (!museumName || !MUSEUMS.includes(museumName)) {
    return res.status(400).json({ error: "Your museum account is not assigned to a valid recognized museum." });
  }

  const items = await Item.find({
    allocation: "Museum",
    museumName: museumName,
  }).sort({ updatedAt: -1 });

  res.json({ items });
});

router.put("/my-museum-items/:itemId", async (req, res) => {
  const museumName = normalizeMuseumName(req.user.roleProfile?.museum_name);
  if (!museumName || !MUSEUMS.includes(museumName)) {
    return res.status(400).json({ error: "Your museum account is not assigned to a valid recognized museum." });
  }

  const item = await Item.findOne({ _id: req.params.itemId, allocation: "Museum", museumName: museumName });
  if (!item) {
    return res.status(404).json({ error: "Artifact not found in your museum inventory." });
  }

  const allowed = ["name", "Type", "description", "civilization", "era", "region", "material", "usage", "location"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }

  await item.save();
  res.json({ item });
});

// POST /api/mm/request_items  (was /m_manager/request_items)
router.post("/request_items", async (req, res) => {
  try {
    const { item_id, purpose, start_date, end_date, insurance_info } = req.body;
    const request = await ItemRequest.create({
      museum_manager: req.user._id,
      item: item_id,
      purpose,
      start_date,
      end_date,
      insurance_info,
      approval_status: "Pending",
    });

    // Notification: museum loan request waiting on the Government/Admin.
    const artifact = await Item.findById(item_id).select("name");
    await notifyAdmins({
      category: "request",
      type: "item.request.submitted",
      title: "New museum item request",
      message: `${req.user.roleProfile?.museum_name || req.user.name} requested "${artifact?.name || "an artifact"}" for ${purpose}.`,
      link: "/admin/item-requests",
      dashboardKey: "item_requests",
      actionRequired: true,
    }, [req.user._id]);

    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit item request." });
  }
});

// GET /api/mm/my-requests -> this manager's own request history
router.get("/my-requests", async (req, res) => {
  const requests = await ItemRequest.find({ museum_manager: req.user._id }).populate("item", "name Type");
  res.json({ requests });
});

// GET /api/mm/exhibitions -> all of this manager's own listings (any status)
router.get("/exhibitions", async (req, res) => {
  const exhibitions = await Exhibition.find({ museum_manager: req.user._id }).sort({ start_date: 1 });
  res.json({ exhibitions });
});

// GET /api/mm/exhibitions/:id -> single listing (must belong to this manager)
router.get("/exhibitions/:id", async (req, res) => {
  const exhibition = await Exhibition.findOne({ _id: req.params.id, museum_manager: req.user._id });
  if (!exhibition) return res.status(404).json({ error: "Exhibition not found." });
  res.json({ exhibition });
});

// POST /api/mm/exhibitions -> create a new exhibition/tour/event (starts as a draft)
router.post("/exhibitions", async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      image,
      site,
      location,
      start_date,
      end_date,
      start_time,
      end_time,
      capacity,
      ticket_info,
      contact,
      publish,
    } = req.body;

    if (!title || !type || !start_date || !end_date) {
      return res.status(400).json({ error: "title, type, start_date, and end_date are required." });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: "end_date cannot be before start_date." });
    }

    const exhibition = await Exhibition.create({
      museum_manager: req.user._id,
      museum_name: req.user.roleProfile?.museum_name || "",
      title,
      type,
      description,
      image: image || null,
      site: site || null,
      location: {
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        address: location?.address || "",
      },
      start_date,
      end_date,
      start_time,
      end_time,
      capacity: capacity || null,
      ticket_info,
      contact,
      status: publish ? "published" : "draft",
    });

    if (publish) await announceExhibition(exhibition, req.user._id);

    res.status(201).json({ exhibition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create exhibition." });
  }
});

// PUT /api/mm/exhibitions/:id -> edit an existing listing owned by this manager
router.put("/exhibitions/:id", async (req, res) => {
  try {
    const exhibition = await Exhibition.findOne({ _id: req.params.id, museum_manager: req.user._id });
    if (!exhibition) return res.status(404).json({ error: "Exhibition not found." });

    const {
      title,
      type,
      description,
      image,
      site,
      location,
      start_date,
      end_date,
      start_time,
      end_time,
      capacity,
      ticket_info,
      contact,
    } = req.body;

    if (title !== undefined) exhibition.title = title;
    if (type !== undefined) exhibition.type = type;
    if (description !== undefined) exhibition.description = description;
    if (image !== undefined) exhibition.image = image;
    if (site !== undefined) exhibition.site = site || null;
    if (location !== undefined) {
      exhibition.location = {
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        address: location?.address || "",
      };
    }
    if (start_date !== undefined) exhibition.start_date = start_date;
    if (end_date !== undefined) exhibition.end_date = end_date;
    if (start_time !== undefined) exhibition.start_time = start_time;
    if (end_time !== undefined) exhibition.end_time = end_time;
    if (capacity !== undefined) exhibition.capacity = capacity || null;
    if (ticket_info !== undefined) exhibition.ticket_info = ticket_info;
    if (contact !== undefined) exhibition.contact = contact;

    if (new Date(exhibition.end_date) < new Date(exhibition.start_date)) {
      return res.status(400).json({ error: "end_date cannot be before start_date." });
    }

    await exhibition.save();
    res.json({ exhibition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update exhibition." });
  }
});

// PATCH /api/mm/exhibitions/:id/publish -> make it visible on public pages / Near Me
router.patch("/exhibitions/:id/publish", async (req, res) => {
  const exhibition = await Exhibition.findOneAndUpdate(
    { _id: req.params.id, museum_manager: req.user._id },
    { status: "published" },
    { new: true }
  );
  if (!exhibition) return res.status(404).json({ error: "Exhibition not found." });

  await announceExhibition(exhibition, req.user._id);

  res.json({ exhibition });
});

// PATCH /api/mm/exhibitions/:id/unpublish -> pull it back to draft (hides it from the public)
router.patch("/exhibitions/:id/unpublish", async (req, res) => {
  const exhibition = await Exhibition.findOneAndUpdate(
    { _id: req.params.id, museum_manager: req.user._id },
    { status: "draft" },
    { new: true }
  );
  if (!exhibition) return res.status(404).json({ error: "Exhibition not found." });
  res.json({ exhibition });
});

// PATCH /api/mm/exhibitions/:id/cancel -> mark cancelled (still visible with a "cancelled" badge, optional)
router.patch("/exhibitions/:id/cancel", async (req, res) => {
  const exhibition = await Exhibition.findOneAndUpdate(
    { _id: req.params.id, museum_manager: req.user._id },
    { status: "cancelled" },
    { new: true }
  );
  if (!exhibition) return res.status(404).json({ error: "Exhibition not found." });
  res.json({ exhibition });
});

// DELETE /api/mm/exhibitions/:id
router.delete("/exhibitions/:id", async (req, res) => {
  const exhibition = await Exhibition.findOneAndDelete({ _id: req.params.id, museum_manager: req.user._id });
  if (!exhibition) return res.status(404).json({ error: "Exhibition not found." });
  res.json({ message: "Exhibition deleted." });
});

module.exports = router;