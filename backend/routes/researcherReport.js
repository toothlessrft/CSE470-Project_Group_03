//Researcher Report: Ahad
const express = require("express");
const ResearcherReport = require("../models/ResearcherReport");
const DiscoveryReport = require("../models/DiscoveryReport");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("archaeologist"));

// GET /api/researcher-report/:discoveryId
// Fetch the report for the given discovery. If it doesn't exist, create an initial draft.
router.get("/:discoveryId", async (req, res) => {
    try {
        const { discoveryId } = req.params;

        // Verify researcher is assigned to this discovery and it's valid
        const discovery = await DiscoveryReport.findOne({
            _id: discoveryId,
            "assignment.researcher": req.user._id,
            "verification.result": "true",
        });

        if (!discovery) {
            return res.status(403).json({ error: "Access denied or discovery not verified." });
        }

        let report = await ResearcherReport.findOne({ discoveryReport: discoveryId });
        if (!report) {
            // Create initial empty draft
            report = await ResearcherReport.create({
                discoveryReport: discoveryId,
                researcher: req.user._id,
            });
        }

        res.json({ report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch researcher report." });
    }
});

// POST /api/researcher-report/:discoveryId/save
// Save draft
router.post("/:discoveryId/save", async (req, res) => {
    try {
        const { discoveryId } = req.params;
        const { possibleArtifact, notes, budgetRequested, requestExcavationTeam } = req.body;

        const report = await ResearcherReport.findOne({
            discoveryReport: discoveryId,
            researcher: req.user._id,
        });

        if (!report) return res.status(404).json({ error: "Report draft not found." });
        if (report.status === "Submitted") {
            return res.status(400).json({ error: "Cannot modify a submitted report." });
        }

        report.possibleArtifact = Boolean(possibleArtifact);
        report.notes = notes || "";
        report.budgetRequested = budgetRequested ? Number(budgetRequested) : null;
        report.requestExcavationTeam = Boolean(requestExcavationTeam);

        await report.save();
        res.json({ message: "Draft saved.", report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save draft." });
    }
});


// POST /api/researcher-report/:discoveryId/submit
// Submit final draft
router.post("/:discoveryId/submit", async (req, res) => {
    try {
        const { discoveryId } = req.params;

        const report = await ResearcherReport.findOne({
            discoveryReport: discoveryId,
            researcher: req.user._id,
        });

        if (!report) return res.status(404).json({ error: "Report not found." });

        report.status = "Submitted";
        await report.save();

        res.json({ message: "Final report submitted.", report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit final report." });
    }
});

module.exports = router;
