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
const { requireAuth, requireRole } = require("../middleware/auth");

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

// GET/POST /api/arc/request_excavation  (was /arc/request_excavation)
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

    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit excavation request." });
  }
});

// GET /api/arc/projects  (was /arc/manage_project)
router.get("/projects", async (req, res) => {
  const base = { lead_archaeologist: req.user._id };
  const [ongoing, past] = await Promise.all([
    ExcavationProject.find({ ...base, end_date: null }).populate("site"),
    ExcavationProject.find({ ...base, end_date: { $ne: null } }).populate("site"),
  ]);
  res.json({ ongoing_projects: ongoing, past_projects: past });
});

// POST /api/arc/projects/:id/end  (was /project/<id>/end)
router.post("/projects/:id/end", async (req, res) => {
  await ExcavationProject.updateOne(
    { _id: req.params.id, lead_archaeologist: req.user._id },
    { end_date: new Date() }
  );
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
  res.status(201).json({ request });
});

// GET /api/arc/projects/:id/team  (was /project/<id>/team)
router.get("/projects/:id/team", async (req, res) => {
  const project = await ExcavationProject.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found." });
  const teams = await ETeam.find({ project: project._id }).populate("manager", "nid name");
  res.json({ p_name: project.p_name, teams });
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

    const { name, description, discovery_date, Type, specialization } = req.body;

    const item = await Item.create({
      site: project.site,
      name,
      description,
      discovery_date,
      Type,
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
    .sort("-assignment.assigned_at");
  res.json({ reports });
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
  res.json({ report });
});

module.exports = router;
