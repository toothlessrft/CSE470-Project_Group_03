const express = require("express");
const Site = require("../models/Site");
const Item = require("../models/Item");
const ItemRequest = require("../models/ItemRequest");
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

module.exports = router;
