const express = require("express");
const Site = require("../models/Site");
const Item = require("../models/Item");
const ItemRequest = require("../models/ItemRequest");
const Exhibition = require("../models/Exhibition");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("museum_manager"));

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

// ---------------------------------------------------------------------
// Exhibition Management: schedule/manage Exhibitions, Educational tours,
// and Cultural events, then publish them for public discovery.
// ---------------------------------------------------------------------

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