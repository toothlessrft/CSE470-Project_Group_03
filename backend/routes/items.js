const express = require("express");
const Item = require("../models/Item");
const Site = require("../models/Site");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// POST /api/items -> Create a new artifact directly
router.post("/", requireRole("archaeologist"), async (req, res) => {
    try {
        const { name, picture, description, discovery_date, location, Type, civilization, era, region, material, usage, latitude, longitude, site_name } = req.body;

        let siteId = req.body.site;

        // If site is not provided, and coords are provided, create a hidden virtual site for the map coords
        if (!siteId && latitude && longitude) {
            const dummySite = await Site.create({
                name: site_name || `Discovered location for ${name}`,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                era: era,
                architecture: "Unknown/Artifact specific location"
            });
            siteId = dummySite._id;
        }

        const item = await Item.create({
            site: siteId,
            name,
            picture,
            description,
            discovery_date,
            location,
            Type: Type || "other",
            civilization,
            era,
            region,
            material,
            usage,
        });

        res.status(201).json({ item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not create item." });
    }
});

// PUT /api/items/:id -> Edit an existing artifact
router.put("/:id", async (req, res) => {
    try {
        const allowed = ["name", "picture", "description", "location", "Type", "civilization", "era", "region", "material", "usage"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Item not found." });

        if (req.user.role === "museum_manager") {
            const managerMuseum = req.user.roleProfile?.museum_name;
            const isOwnedMuseumArtifact =
                (item.allocation === "Museum" && (item.museumName === managerMuseum || item.location === managerMuseum));
            if (!managerMuseum || !isOwnedMuseumArtifact) {
                return res.status(403).json({ error: "You can only edit artifacts stored in your own museum." });
            }
        } else if (req.user.role !== "archaeologist") {
            return res.status(403).json({ error: "You are not allowed to edit artifacts." });
        }

        if (req.body.latitude && req.body.longitude) {
            if (item.site) {
                await Site.findByIdAndUpdate(item.site, {
                    latitude: parseFloat(req.body.latitude),
                    longitude: parseFloat(req.body.longitude)
                });
            } else {
                const dummySite = await Site.create({
                    name: `Discovered location for ${item.name}`,
                    latitude: parseFloat(req.body.latitude),
                    longitude: parseFloat(req.body.longitude)
                });
                updates.site = dummySite._id;
            }
        }

        const updatedItem = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json({ item: updatedItem });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not update item." });
    }
});

// DELETE /api/items/:id -> Delete an artifact
router.delete("/:id", requireRole("archaeologist"), async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: "Item not found." });
        res.json({ message: "Artifact deleted successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not delete item." });
    }
});

module.exports = router;
