const express = require("express");
const KnowledgeResource = require("../models/KnowledgeResource");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const ALL_TYPES = ["research_paper", "book", "article", "historical_reference", "vlog_audio"];

// Categories a guest (not logged in) may view.
const GUEST_VISIBLE_TYPES = ["research_paper", "article"];

// Which roles may upload NEW material into each category.
// "Researcher" is the same account as "archaeologist" in this system
// (see Register.jsx: role "archaeologist" is labeled "Archaeologist / Researcher").
// "Excavation Team" is the "site_caretaker" role (see Register.jsx label).
const CATEGORY_UPLOAD_ROLES = {
  research_paper: ["archaeologist"],
  book: ["archaeologist"],
  article: ["archaeologist", "museum_manager"],
  historical_reference: ["archaeologist"],
  vlog_audio: ["archaeologist", "site_caretaker"],
};

// GET /api/knowledge
router.get("/", optionalAuth, async (req, res) => {
  try {
    const isRegistered = !!req.user;
    const { type, q } = req.query;

    const filter = {};

    if (!isRegistered) {
      // Guests can only ever see Research Papers and Articles.
      filter.type = { $in: GUEST_VISIBLE_TYPES };
    }
    // Any logged-in user (including "public"/General Public) can view all
    // 5 categories, they just can't modify them.

    // Apply type filter if provided
    if (type) {
      if (!isRegistered && !GUEST_VISIBLE_TYPES.includes(type)) {
        return res.json({ resources: [] });
      }
      filter.type = type;
    }

    // Apply text search if provided
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
      ];
    }

    const resources = await KnowledgeResource.find(filter)
      .populate("addedBy", "name email role")
      .sort("-createdAt");

    res.json({ resources });
  } catch (err) {
    console.error("Error fetching knowledge resources:", err);
    res.status(500).json({ error: "Failed to fetch knowledge resources." });
  }
});

// POST /api/knowledge
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, type, author, content, url, mediaType } = req.body;

    // Admins can never add material, only delete it.
    if (req.user.role === "admin") {
      return res.status(403).json({ error: "Admins are not permitted to add knowledge material." });
    }

    if (!title || !type) {
      return res.status(400).json({ error: "Title and type are required fields." });
    }

    if (!ALL_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid resource type." });
    }

    const allowedRoles = CATEGORY_UPLOAD_ROLES[type] || [];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Your role is not permitted to upload to this category.", code: "UNAUTHORIZED" });
    }

    if (type === "vlog_audio") {
      // Excavation Diaries require an actual photo or video, not just text.
      if (!url) {
        return res.status(400).json({ error: "A photo or video is required for Excavation Diaries." });
      }
      if (!["photo", "video"].includes(mediaType)) {
        return res.status(400).json({ error: "mediaType must be 'photo' or 'video'." });
      }
    }

    const resource = await KnowledgeResource.create({
      title,
      type,
      author: author || "",
      content: content || "",
      url: url || "",
      mediaType: type === "vlog_audio" ? mediaType : null,
      addedBy: req.user._id,
    });

    const populated = await resource.populate("addedBy", "name email role");

    res.status(201).json({ resource: populated });
  } catch (err) {
    console.error("Error creating knowledge resource:", err);
    res.status(500).json({ error: "Failed to create knowledge resource." });
  }
});

// PUT /api/knowledge/:id  (edit)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const resource = await KnowledgeResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found." });
    }

    // Only the original uploader may edit their own material.
    if (!resource.addedBy.equals(req.user._id)) {
      return res.status(403).json({ error: "Only the user who uploaded this material can edit it." });
    }

    const { title, author, content, url, mediaType } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: "Title cannot be empty." });
      }
      resource.title = title;
    }
    if (author !== undefined) resource.author = author;
    if (content !== undefined) resource.content = content;

    if (resource.type === "vlog_audio") {
      if (url !== undefined) resource.url = url;
      if (mediaType !== undefined) {
        if (!["photo", "video"].includes(mediaType)) {
          return res.status(400).json({ error: "mediaType must be 'photo' or 'video'." });
        }
        resource.mediaType = mediaType;
      }
      if (!resource.url) {
        return res.status(400).json({ error: "A photo or video is required for Excavation Diaries." });
      }
    } else if (url !== undefined) {
      resource.url = url;
    }

    await resource.save();
    const populated = await resource.populate("addedBy", "name email role");

    res.json({ resource: populated });
  } catch (err) {
    console.error("Error updating knowledge resource:", err);
    res.status(500).json({ error: "Failed to update knowledge resource." });
  }
});

// DELETE /api/knowledge/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const resource = await KnowledgeResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found." });
    }

    // Admin can delete anything; otherwise only the uploader can delete their own.
    if (req.user.role !== "admin" && !resource.addedBy.equals(req.user._id)) {
      return res.status(403).json({ error: "Not authorized to delete this resource." });
    }

    await KnowledgeResource.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted successfully." });
  } catch (err) {
    console.error("Error deleting knowledge resource:", err);
    res.status(500).json({ error: "Failed to delete knowledge resource." });
  }
});

module.exports = router;
