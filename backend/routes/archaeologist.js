const express = require("express");
const User = require("../models/User");
const Site = require("../models/Site");
const ExcavationRequest = require("../models/ExcavationRequest");
const ExcavationProject = require("../models/ExcavationProject");
const ETeam = require("../models/ETeam");
const Item = require("../models/Item");
const Tool = require("../models/Tool");
const ToolRentalRequest = require("../models/ToolRentalRequest");
const DiscoveryReport = require("../models/DiscoveryReport");
const ResearcherReport = require("../models/ResearcherReport"); // Researcher Report: Ahad
const { requireAuth, requireRole } = require("../middleware/auth");
const { notify, notifyAdmins } = require("../services/notify"); // Role-Based Notification & Reminder System
const { sendReviewRequests } = require("../services/reviewNotifications"); // Cross Feedback & Performance Review

const router = express.Router();
router.use(requireAuth, requireRole("archaeologist"));

// GET /api/arc/dashboard  (was /arc/dashboard)
router.get("/dashboard", async (req, res) => {
  res.json({
    archaeologist: {
      nid: req.user.nid,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      profile_pic: req.user.profile_pic,
      affiliation: req.user.roleProfile?.affiliation,
      biography: req.user.roleProfile?.biography,
    },
  });
});

// GET /api/arc/sites  -> dropdown of existing sites for the request-excavation form
router.get("/sites", async (req, res) => {
  const sites = await Site.find().select("_id name").sort("name");
  res.json({ sites });
});

// GET /api/arc/request_excavation -> Fetch all existing requests for this archaeologist
router.get("/request_excavation", async (req, res) => {
  const requests = await ExcavationRequest.find({ archaeologist: req.user._id })
    .populate("site", "name era")
    .sort("-createdAt");
  res.json({ requests });
});

// POST /api/arc/request_excavation
router.post("/request_excavation", async (req, res) => {
  try {
    const { existing_site, new_site_name, era, description, architecture, proposal, budget } = req.body;

    let siteId = existing_site;
    if (!siteId) {
      if (!new_site_name) {
        return res.status(400).json({ error: "New site name required if not selecting an existing site." });
      }
      const site = await Site.create({ name: new_site_name, era, description, architecture });
      siteId = site._id;
    }

    const request = await ExcavationRequest.create({
      site: siteId,
      archaeologist: req.user._id,
      proposal,
      budget,
    });

    // Notification: excavation proposal waiting on the Government/Admin.
    await notifyAdmins({
      category: "request",
      type: "excavation.request.submitted",
      title: "New excavation request",
      message: `${req.user.name} submitted an excavation proposal with a requested budget of ${budget ?? "-"}.`,
      link: "/admin/excavation-requests",
      dashboardKey: "excavation_requests",
      actionRequired: true,
    }, [req.user._id]);

    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit excavation request." });
  }
});

// GET /api/arc/projects  (was /arc/manage_project)
router.get("/projects", async (req, res) => {
  const base = { lead_archaeologist: req.user._id };
  // Ahad_23201016 - also surface the excavation team awarded through the
  // tender process, plus the artifacts recovered so far.
  const populateAll = (q) =>
    q
      .populate("site")
      .populate("excavation_team", "nid name email phone roleProfile")
      .populate("artifacts", "name Type pending_allocation allocation")
      .sort("-createdAt");

  const [ongoing, past] = await Promise.all([
    populateAll(ExcavationProject.find({ ...base, end_date: null })),
    populateAll(ExcavationProject.find({ ...base, end_date: { $ne: null } })),
  ]);
  res.json({ ongoing_projects: ongoing, past_projects: past });
});

// POST /api/arc/projects/:id/end  (was /project/<id>/end)
router.post("/projects/:id/end", async (req, res) => {
  const result = await ExcavationProject.updateOne(
    { _id: req.params.id, lead_archaeologist: req.user._id, end_date: null },
    { end_date: new Date() }
  );

  // Cross Feedback & Performance Review System: this is the second way a dig
  // can finish (the other is /api/tenders/projects/:id/complete), so the
  // review prompts have to be raised here too - otherwise a project ended
  // from "Manage Projects" would never ask either side for a rating.
  // Guarded on modifiedCount so re-ending an already-finished project is a
  // no-op rather than a second round of prompts.
  if (result.modifiedCount) {
    const project = await ExcavationProject.findById(req.params.id);
    await sendReviewRequests(project);
  }

  res.json({ message: "Project ended." });
});

// GET /api/arc/tools -> list of all rentable tools
router.get("/tools", async (req, res) => {
  const tools = await Tool.find().select("_id model_no type owner");
  res.json({ tools });
});

// POST /api/arc/projects/:id/tools  (was /project/<id>/tools)
router.post("/projects/:id/tools", async (req, res) => {
  const { tool_id, start_date, end_date, purpose } = req.body;
  const request = await ToolRentalRequest.create({
    user: req.user._id,
    tool: tool_id,
    project: req.params.id,
    start_date,
    end_date,
    purpose,
    approval_status: "Pending",
  });

  // Notification: equipment request waiting for approval.
  await notifyAdmins({
    category: "request",
    type: "tool.request.submitted",
    title: "New equipment request",
    message: `${req.user.name} requested equipment for an active excavation project.`,
    link: "/admin/tool-inventory",
    dashboardKey: "tool_requests",
    actionRequired: true,
  }, [req.user._id]);

  res.status(201).json({ request });
});

// GET /api/arc/projects/:id/team  (was /project/<id>/team)
router.get("/projects/:id/team", async (req, res) => {
  const project = await ExcavationProject.findById(req.params.id).populate(
    "excavation_team",
    "nid name email phone roleProfile"
  );
  if (!project) return res.status(404).json({ error: "Project not found." });
  const teams = await ETeam.find({ project: project._id }).populate("manager", "nid name");

  // Ahad_23201016 - the awarded excavation team (company + representative)
  const et = project.excavation_team;
  const excavation_team = et
    ? {
        _id: et._id,
        nid: et.nid,
        company_name: et.roleProfile?.company_name || et.roleProfile?.organization || et.name,
        representative: et.name,
        representative_designation: et.roleProfile?.representative_designation || "",
        team_size: et.roleProfile?.team_size ?? null,
        email: et.email,
        phone: et.phone,
      }
    : null;

  res.json({
    p_name: project.p_name,
    teams,
    excavation_team,
    agreed_timeline_days: project.agreed_timeline_days,
    budget: project.budget,
  });
});

// POST /api/arc/projects/:id/team  -> add/promote a manager and create a new team
router.post("/projects/:id/team", async (req, res) => {
  try {
    const projectId = req.params.id;
    const { role, manager_nid, member_list, name, email, phone } = req.body;

    const managerUser = await User.findOne({ nid: manager_nid });
    if (managerUser) {
      const alreadyManaging = await ETeam.findOne({ manager: managerUser._id });
      if (alreadyManaging) {
        return res.status(400).json({ error: "This person already manages a team." });
      }
      if (managerUser.role !== "manager") {
        managerUser.role = "manager";
        await managerUser.save();
      }
    }

    let managerRef = managerUser;
    if (!managerRef) {
      managerRef = await User.create({
        nid: manager_nid,
        role: "manager",
        name,
        email,
        phone,
        password: await require("bcryptjs").hash("defaultpass", 10),
      });
    }

    const lastTeam = await ETeam.find({ project: projectId }).sort("-teamNo").limit(1);
    const nextTeamNo = lastTeam.length ? lastTeam[0].teamNo + 1 : 1;

    const team = await ETeam.create({
      project: projectId,
      teamNo: nextTeamNo,
      role,
      manager: managerRef._id,
      member_list,
    });

    res.status(201).json({ team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create team." });
  }
});

// DELETE /api/arc/projects/:id/team/:teamNo  (was /project/<id>/team/<teamNo>/disband)
router.delete("/projects/:id/team/:teamNo", async (req, res) => {
  await ETeam.deleteOne({ project: req.params.id, teamNo: req.params.teamNo });
  res.json({ message: "Team disbanded." });
});

// GET/PATCH /api/arc/projects/:id/site  (was /project/<id>/site, edit_site)
router.get("/projects/:id/site", async (req, res) => {
  const project = await ExcavationProject.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found." });
  const site = await Site.findById(project.site);
  if (!site) return res.status(404).json({ error: "Site not found." });
  res.json({ site });
});

router.patch("/projects/:id/site", async (req, res) => {
  const project = await ExcavationProject.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found." });

  const allowed = ["description", "era", "s_thana", "s_district", "s_street", "architecture"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key]) updates[key] = req.body[key];
  }

  const site = await Site.findByIdAndUpdate(project.site, updates, { new: true });
  res.json({ site });
});

// GET site + POST item for a project (was /project/<id>/items, add_item)
router.get("/projects/:id/items", async (req, res) => {
  const project = await ExcavationProject.findOne({
    _id: req.params.id,
    lead_archaeologist: req.user._id,
    end_date: null,
  }).populate("site", "name");
  if (!project) return res.status(404).json({ error: "No active site found." });
  res.json({ site_id: project.site._id, site_name: project.site.name });
});

router.post("/projects/:id/items", async (req, res) => {
  try {
    const project = await ExcavationProject.findOne({
      _id: req.params.id,
      lead_archaeologist: req.user._id,
      end_date: null,
    });
    if (!project) return res.status(404).json({ error: "No active site found." });

    const { name, description, discovery_date, Type, specialization, picture } = req.body;

    const item = await Item.create({
      site: project.site,
      name,
      description,
      discovery_date,
      Type,
      picture: picture || "",
      specialization, // { utility_pottery, material_type, utility_metal, alloy, painter, ... age, ... }
    });

    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add item." });
  }
});

// ---- Field inspection assignments (from Government/Admin) -----------------

// GET /api/arc/assignments -> discovery reports assigned to me for verification
router.get("/assignments", async (req, res) => {
  const reports = await DiscoveryReport.find({ "assignment.researcher": req.user._id })
    .populate("reporter", "name email phone")
    .sort("-assignment.assigned_at")
    .lean();

  // Find all researcher reports mapped to these discovery reports
  const discoveryIds = reports.map(r => r._id);
  const researcherReports = await ResearcherReport.find({ discoveryReport: { $in: discoveryIds } }).lean();

  const reportsWithStatus = reports.map(r => {
    const rReport = researcherReports.find(rr => rr.discoveryReport.toString() === r._id.toString());
    return { ...r, researcherReportStatus: rReport ? rReport.status : null };
  });

  res.json({ reports: reportsWithStatus });
});

// POST /api/arc/assignments/:id/verify -> submit field verification result
router.post("/assignments/:id/verify", async (req, res) => {
  const { result, notes } = req.body;
  if (!["true", "false"].includes(result)) {
    return res.status(400).json({ error: "result must be 'true' or 'false'." });
  }

  const report = await DiscoveryReport.findOneAndUpdate(
    { _id: req.params.id, "assignment.researcher": req.user._id },
    {
      status: result === "true" ? "Verified" : "Rejected",
      verification: { result, notes: notes || "", submitted_at: new Date() },
    },
    { new: true }
  );

  if (!report) return res.status(404).json({ error: "Assignment not found." });

  // Notification: outcome to the original reporter, and a heads-up to the
  // Government/Admin that the field verification has landed.
  await notify({
    user: report.reporter,
    category: "report",
    type: result === "true" ? "report.verified" : "report.rejected",
    title: result === "true" ? "Your discovery was verified" : "Your discovery was not verified",
    message:
      result === "true"
        ? "A researcher confirmed the artifact you reported. Thank you for helping preserve heritage."
        : `The field inspection did not confirm an artifact at this location.${notes ? ` Note: ${notes}` : ""}`,
    link: "/my-reports",
  });

  await notifyAdmins({
    category: "report",
    type: "inspection.completed",
    title: result === "true" ? "Field inspection verified a discovery" : "Field inspection found nothing",
    message: `${req.user.name} submitted their verification for a reported discovery.`,
    link: `/admin/reports/${report._id}`,
    dashboardKey: "field_reports",
    actionRequired: result === "true",
  }, [req.user._id]);

  res.json({ report });
});

module.exports = router;
