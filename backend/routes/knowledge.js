const express = require("express");
const KnowledgeResource = require("../models/KnowledgeResource");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/knowledge
router.get("/", optionalAuth, async (req, res) => {
  try {
    const isRegistered = !!req.user;
    const { type, q } = req.query;

    const filter = {};

    if (!isRegistered) {
      // Unregistered users can only see Research papers and Historical references
      filter.type = { $in: ["research_paper", "historical_reference"] };
    }

    // Apply type filter if provided
    if (type) {
      if (!isRegistered && !["research_paper", "historical_reference"].includes(type)) {
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
router.post("/", requireAuth, requireRole("archaeologist", "admin"), async (req, res) => {
  try {
    const { title, type, author, content, url } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: "Title and type are required fields." });
    }

    const allowedTypes = ["research_paper", "book", "article", "historical_reference", "vlog_audio"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid resource type." });
    }

    const resource = await KnowledgeResource.create({
      title,
      type,
      author: author || "",
      content: content || "",
      url: url || "",
      addedBy: req.user._id,
    });

    const populated = await resource.populate("addedBy", "name email role");

    res.status(201).json({ resource: populated });
  } catch (err) {
    console.error("Error creating knowledge resource:", err);
    res.status(500).json({ error: "Failed to create knowledge resource." });
  }
});

// DELETE /api/knowledge/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const resource = await KnowledgeResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found." });
    }

    // Only allow deletion if user is admin or the user who added it
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
