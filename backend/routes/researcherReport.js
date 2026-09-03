// Researcher Report - Ahad
const express = require("express");
const ResearcherReport = require("../models/ResearcherReport");
const DiscoveryReport = require("../models/DiscoveryReport");
const { requireAuth, requireRole } = require("../middleware/auth");
const { notifyAdmins } = require("../services/notify"); // Role-Based Notification & Reminder System

const router = express.Router();

router.use(requireAuth, requireRole("archaeologist"));

// GET /api/researcher-report/:discoveryId -> the report for this discovery,
// creating an empty draft if there is none yet.
router.get("/:discoveryId", async (req, res) => {
    try {
        const { discoveryId } = req.params;

        // The researcher must actually be assigned to this discovery.
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
        const { possibleArtifact, notes, budgetRequested, requestExcavationTeam, artifacts } = req.body;

        const report = await ResearcherReport.findOne({
            discoveryReport: discoveryId,
            researcher: req.user._id,
        });

        if (!report) return res.status(404).json({ error: "Report draft not found." });
        if (report.status !== "Draft") {
            return res.status(400).json({ error: "Cannot modify a report that has already been submitted." });
        }

        report.possibleArtifact = Boolean(possibleArtifact);
        report.notes = notes || "";
        report.budgetRequested = budgetRequested ? Number(budgetRequested) : null;
        report.requestExcavationTeam = Boolean(requestExcavationTeam);

        // Artifacts found on site, same shape as the "Add Artifact" form.
        if (Array.isArray(artifacts)) {
            report.artifacts = artifacts.map((a) => ({
                name: a.name,
                description: a.description || "",
                Type: a.Type || "other",
                civilization: a.civilization || "",
                era: a.era || "",
                region: a.region || "",
                material: a.material || "",
                usage: a.usage || "",
                picture: a.picture || "",
            }));
        }

        await report.save();
        res.json({ message: "Draft saved.", report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save draft." });
    }
});


// POST /api/researcher-report/:discoveryId/submit
// Submit final draft -> goes to Pending, awaiting admin approval
router.post("/:discoveryId/submit", async (req, res) => {
    try {
        const { discoveryId } = req.params;
        const { possibleArtifact, notes, budgetRequested, requestExcavationTeam } = req.body || {};

        const report = await ResearcherReport.findOne({
            discoveryReport: discoveryId,
            researcher: req.user._id,
        });

        if (!report) return res.status(404).json({ error: "Report not found." });
        if (report.status !== "Draft") {
            return res.status(400).json({ error: "This report has already been submitted." });
        }

        // Submitting without saving a draft first still has to persist what is
        // on screen, or the notes and team request are lost.
        if (possibleArtifact !== undefined) report.possibleArtifact = Boolean(possibleArtifact);
        if (notes !== undefined) report.notes = notes || "";
        if (budgetRequested !== undefined) report.budgetRequested = budgetRequested ? Number(budgetRequested) : null;
        if (requestExcavationTeam !== undefined) report.requestExcavationTeam = Boolean(requestExcavationTeam);

        report.status = "Pending";
        await report.save();

        // The report, and any budget or team request in it, now needs a decision.
        await notifyAdmins({
            category: "report",
            type: "researcher.report.submitted",
            title: "Field report submitted for review",
            message: `${req.user.name} submitted a field report with ${report.artifacts?.length || 0} artifact(s)${report.budgetRequested ? ` and a budget request of ${report.budgetRequested}` : ""}.`,
            link: `/admin/reports/${discoveryId}`,
            dashboardKey: "field_reports",
            actionRequired: true,
        }, [req.user._id]);

        res.json({ message: "Final report submitted and is now pending admin approval.", report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit final report." });
    }
});

module.exports = router;
