// Ahad_23201016 - Tender Publication & Management (Government)
//                 + Tender Bidding System (Excavation Team)
const express = require("express");
const Tender = require("../models/Tender");
const TenderBid = require("../models/TenderBid");
const ExcavationProject = require("../models/ExcavationProject");
const DiscoveryReport = require("../models/DiscoveryReport");
const ResearcherReport = require("../models/ResearcherReport");
const Site = require("../models/Site");
const Item = require("../models/Item");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { requireAuth, requireRole } = require("../middleware/auth");
const { notify, notifyMany, notifyRole, notifyAdmins } = require("../services/notify"); // Role-Based Notification & Reminder System
<<<<<<< Updated upstream
=======
const { ensureChatForProject, archiveChatForProject } = require("../services/teamChat"); // Project Team Group Chat
const { sendReviewRequests } = require("../services/reviewNotifications"); // Cross Feedback & Performance Review
>>>>>>> Stashed changes

const router = express.Router();
router.use(requireAuth);

// ---------------------------------------------------------------------------
// Ahad_23201016 - helpers
// ---------------------------------------------------------------------------

// Site.name and ExcavationProject.p_name are both unique, so a second dig at
// the same address would otherwise blow up. Suffix until the name is free.
async function uniqueName(Model, field, base) {
  const clean = (base || "Excavation").trim() || "Excavation";
  let candidate = clean;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ [field]: candidate })) {
    candidate = `${clean} (${n})`;
    n += 1;
  }
  return candidate;
}

function companyOf(user) {
  return user?.roleProfile?.company_name || user?.roleProfile?.organization || user?.name || "";
}

// Shape an excavation team for display without leaking anything sensitive.
function serializeTeam(team) {
  if (!team) return null;
  return {
    _id: team._id,
    nid: team.nid,
    company_name: companyOf(team),
    representative: team.name,
    representative_designation: team.roleProfile?.representative_designation || "",
    team_size: team.roleProfile?.team_size ?? null,
    email: team.email,
    phone: team.phone,
  };
}

const TEAM_FIELDS = "nid name email phone roleProfile";

// A tender stops accepting new/edited bids the moment its deadline passes.
function biddingOpen(tender) {
  return tender.status === "Open" && new Date(tender.deadline).getTime() > Date.now();
}

// Notification: a bid landed and the Government/Admin needs to look at it.
async function announceBid(tender, user, bid, actor) {
  await notifyAdmins(
    {
      category: "tender",
      type: "tender.bid.submitted",
      title: "New bid on a tender",
      message: `${companyOf(user)} bid ${bid.cost} over ${bid.timeline_days} days on "${tender.title}".`,
      link: `/admin/tenders/${tender._id}`,
      dashboardKey: "tenders",
      actionRequired: true,
    },
    [actor]
  );
}

// ===========================================================================
// Ahad_23201016 - GOVERNMENT / ADMIN: publish and manage tenders
// ===========================================================================

// GET /api/tenders/admin/sources
// Approved field reports where the archaeologist asked for an excavation team
// and no tender has been published yet - these are what an admin picks from.
router.get("/admin/sources", requireRole("admin"), async (req, res) => {
  try {
    const reports = await ResearcherReport.find({
      status: "Approved",
      requestExcavationTeam: true,
    })
      .populate("researcher", "name nid email")
      .populate("discoveryReport")
      .sort("-updatedAt");

    const existing = await Tender.find({ status: { $ne: "Cancelled" } }).select("fieldReport");
    const taken = new Set(existing.map((t) => String(t.fieldReport)));

    res.json({
      sources: reports
        .filter((r) => r.discoveryReport && !taken.has(String(r._id)))
        .map((r) => ({
          _id: r._id,
          notes: r.notes,
          budgetRequested: r.budgetRequested,
          researcher: r.researcher,
          discoveryReport: {
            _id: r.discoveryReport._id,
            material: r.discoveryReport.material,
            location: r.discoveryReport.location,
          },
        })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load field reports awaiting a tender." });
  }
});

// GET /api/tenders/admin/projects -> every project born from a tender
router.get("/admin/projects", requireRole("admin"), async (req, res) => {
  const projects = await ExcavationProject.find({ tender: { $ne: null } })
    .populate("site", "name latitude longitude s_district")
    .populate("lead_archaeologist", "name nid email")
    .populate("excavation_team", TEAM_FIELDS)
    .populate("artifacts")
    .sort("-createdAt");

  res.json({
    projects: projects.map((p) => ({
      ...p.toObject(),
      excavation_team: serializeTeam(p.excavation_team),
    })),
  });
});

// GET /api/tenders/admin -> every tender, newest first
router.get("/admin", requireRole("admin"), async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const tenders = await Tender.find(filter)
    .populate("archaeologist", "name nid")
    .populate("awarded_team", TEAM_FIELDS)
    .sort("-createdAt")
    .lean();

  const counts = await TenderBid.aggregate([
    { $match: { status: { $ne: "Withdrawn" } } },
    { $group: { _id: "$tender", count: { $sum: 1 } } },
  ]);
  const byTender = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.json({
    tenders: tenders.map((t) => ({
      ...t,
      awarded_team: serializeTeam(t.awarded_team),
      bid_count: byTender[String(t._id)] || 0,
    })),
  });
});

// POST /api/tenders/admin -> publish a new excavation tender
router.post("/admin", requireRole("admin"), async (req, res) => {
  try {
    const {
      title,
      field_report_id,
      project_details,
      requirements,
      deadline,
      estimated_budget,
      location,
    } = req.body;

    if (!title || !project_details || !deadline || estimated_budget == null) {
      return res.status(400).json({
        error: "Title, project details, deadline, and estimated budget are all required.",
      });
    }
    if (new Date(deadline).getTime() <= Date.now()) {
      return res.status(400).json({ error: "The bidding deadline has to be in the future." });
    }
    if (Number(estimated_budget) < 0) {
      return res.status(400).json({ error: "Estimated budget cannot be negative." });
    }

    let fieldReport = null;
    let discoveryReport = null;
    let archaeologist = null;
    let resolvedLocation = location || {};

    if (field_report_id) {
      fieldReport = await ResearcherReport.findById(field_report_id).populate("discoveryReport");
      if (!fieldReport) return res.status(404).json({ error: "Field report not found." });
      if (fieldReport.status !== "Approved") {
        return res.status(400).json({ error: "Only an approved field report can go out to tender." });
      }

      const duplicate = await Tender.findOne({
        fieldReport: fieldReport._id,
        status: { $ne: "Cancelled" },
      });
      if (duplicate) {
        return res.status(409).json({ error: "A tender has already been published for this field report." });
      }

      discoveryReport = fieldReport.discoveryReport;
      archaeologist = fieldReport.researcher;
      if (discoveryReport?.location) resolvedLocation = discoveryReport.location;
    }

    const tender = await Tender.create({
      title,
      discoveryReport: discoveryReport?._id || null,
      fieldReport: fieldReport?._id || null,
      archaeologist,
      project_details,
      requirements: requirements || "",
      location: {
        lat: resolvedLocation?.lat ?? null,
        lng: resolvedLocation?.lng ?? null,
        address: resolvedLocation?.address || "",
      },
      deadline,
      estimated_budget: Number(estimated_budget),
      created_by: req.user._id,
    });

    // Notification: new tender available to bid on.
    await notifyRole("excavation_team", {
      category: "tender",
      type: "tender.published",
      title: "New excavation tender published",
      message: `"${tender.title}" is open for bids until ${new Date(tender.deadline).toLocaleDateString()}. Estimated budget ${tender.estimated_budget}.`,
      link: "/et/tenders",
      actionRequired: true,
      deadlineAt: tender.deadline,
    });

    res.status(201).json({ tender });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not publish the tender." });
  }
});

// GET /api/tenders/admin/:id -> one tender plus every bid submitted against it
router.get("/admin/:id", requireRole("admin"), async (req, res) => {
  const tender = await Tender.findById(req.params.id)
    .populate("archaeologist", "name nid email")
    .populate("created_by", "name")
    .populate("awarded_team", TEAM_FIELDS)
    .populate("project", "p_name progress end_date");
  if (!tender) return res.status(404).json({ error: "Tender not found." });

  const bids = await TenderBid.find({ tender: tender._id })
    .populate("team", TEAM_FIELDS)
    .sort({ cost: 1 });

  res.json({
    tender: { ...tender.toObject(), awarded_team: serializeTeam(tender.awarded_team) },
    bids: bids.map((b) => ({
      _id: b._id,
      cost: b.cost,
      timeline_days: b.timeline_days,
      proposal: b.proposal,
      status: b.status,
      submitted_at: b.submitted_at,
      updatedAt: b.updatedAt,
      review_notes: b.review_notes,
      company_name: b.company_name || companyOf(b.team),
      team: serializeTeam(b.team),
    })),
  });
});

// PATCH /api/tenders/admin/:id -> edit a tender that hasn't been awarded yet
router.patch("/admin/:id", requireRole("admin"), async (req, res) => {
  const tender = await Tender.findById(req.params.id);
  if (!tender) return res.status(404).json({ error: "Tender not found." });
  if (tender.status !== "Open") {
    return res.status(400).json({ error: "Only an open tender can be edited." });
  }

  const allowed = ["title", "project_details", "requirements", "deadline", "estimated_budget"];
  for (const key of allowed) {
    if (req.body[key] !== undefined && req.body[key] !== "") tender[key] = req.body[key];
  }
  await tender.save();
  res.json({ tender });
});

// POST /api/tenders/admin/:id/cancel
router.post("/admin/:id/cancel", requireRole("admin"), async (req, res) => {
  const tender = await Tender.findById(req.params.id);
  if (!tender) return res.status(404).json({ error: "Tender not found." });
  if (tender.status !== "Open") {
    return res.status(400).json({ error: "Only an open tender can be cancelled." });
  }

  tender.status = "Cancelled";
  tender.cancel_reason = req.body.reason || "";
  await tender.save();

  await TenderBid.updateMany(
    { tender: tender._id, status: "Pending" },
    { status: "Rejected", reviewed_by: req.user._id, reviewed_at: new Date(), review_notes: "Tender cancelled." }
  );

  // Notification: every team that had a live bid.
  const affected = await TenderBid.find({ tender: tender._id }).distinct("team");
  await notifyMany(affected, {
    category: "tender",
    type: "tender.cancelled",
    title: "Tender cancelled",
    message: `"${tender.title}" has been withdrawn by the Government/Admin.${tender.cancel_reason ? ` Reason: ${tender.cancel_reason}` : ""}`,
    link: "/et/bids",
  });

  res.json({ message: "Tender cancelled.", tender });
});

// POST /api/tenders/admin/:id/award  { bid_id, notes }
// Accepts the winning bid, rejects the rest, and spins up the active project
// that both the archaeologist and the excavation team will now see.
router.post("/admin/:id/award", requireRole("admin"), async (req, res) => {
  try {
    const { bid_id, notes } = req.body;
    if (!bid_id) return res.status(400).json({ error: "Pick a winning bid first." });

    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: "Tender not found." });
    if (tender.status !== "Open") {
      return res.status(400).json({ error: "This tender has already been closed." });
    }

    const winningBid = await TenderBid.findOne({ _id: bid_id, tender: tender._id }).populate(
      "team",
      TEAM_FIELDS
    );
    if (!winningBid) return res.status(404).json({ error: "Bid not found for this tender." });
    if (winningBid.status === "Withdrawn") {
      return res.status(400).json({ error: "That bid was withdrawn and can no longer be accepted." });
    }

    // The dig needs a Site with real coordinates so every artifact recovered
    // here lands on the Smart Artifact Search map at the reported spot.
    const address = tender.location?.address || tender.title;
    let site = null;
    if (tender.location?.lat != null && tender.location?.lng != null) {
      site = await Site.findOne({
        latitude: tender.location.lat,
        longitude: tender.location.lng,
      });
    }
    if (!site) {
      site = await Site.create({
        name: await uniqueName(Site, "name", `${address} Excavation Site`),
        description: tender.project_details,
        latitude: tender.location?.lat ?? null,
        longitude: tender.location?.lng ?? null,
        architecture: "Under excavation",
      });
    }

    const project = await ExcavationProject.create({
      p_name: await uniqueName(ExcavationProject, "p_name", tender.title),
      organization: winningBid.company_name || companyOf(winningBid.team),
      start_date: new Date(),
      end_date: null,
      progress: "Just Started",
      lead_archaeologist: tender.archaeologist,
      site: site._id,
      budget: winningBid.cost,
      excavation_team: winningBid.team._id,
      tender: tender._id,
      discoveryReport: tender.discoveryReport,
      location: {
        lat: tender.location?.lat ?? null,
        lng: tender.location?.lng ?? null,
        address: tender.location?.address || "",
      },
      agreed_timeline_days: winningBid.timeline_days,
    });

    winningBid.status = "Accepted";
    winningBid.reviewed_by = req.user._id;
    winningBid.reviewed_at = new Date();
    winningBid.review_notes = notes || "";
    await winningBid.save();

    await TenderBid.updateMany(
      { tender: tender._id, _id: { $ne: winningBid._id }, status: "Pending" },
      {
        status: "Rejected",
        reviewed_by: req.user._id,
        reviewed_at: new Date(),
        review_notes: "Another team was awarded this tender.",
      }
    );

    tender.status = "Awarded";
    tender.awarded_bid = winningBid._id;
    tender.awarded_team = winningBid.team._id;
    tender.awarded_at = new Date();
    tender.project = project._id;
    await tender.save();

    // Notification: winner, the teams that missed out, and the lead researcher.
    await notify({
      user: winningBid.team._id,
      category: "tender",
      type: "tender.bid.accepted",
      title: "Your bid won the tender",
      message: `You have been awarded "${tender.title}". The project "${project.p_name}" is now active with an agreed timeline of ${winningBid.timeline_days} days.`,
      link: `/et/projects/${project._id}`,
      actionRequired: true,
    });

    const losingTeams = await TenderBid.find({
      tender: tender._id,
      _id: { $ne: winningBid._id },
      status: "Rejected",
    }).distinct("team");

    await notifyMany(losingTeams, {
      category: "tender",
      type: "tender.bid.rejected",
      title: "Tender awarded to another team",
      message: `"${tender.title}" has been awarded. Your bid was not selected this time.`,
      link: "/et/bids",
    }, [winningBid.team._id]);

    await notify({
      user: tender.archaeologist,
      category: "assignment",
      type: "project.team.assigned",
      title: "An excavation team was assigned to your site",
      message: `${winningBid.company_name || "A team"} will run "${project.p_name}". You are the lead archaeologist.`,
      link: `/arc/projects/${project._id}`,
      actionRequired: true,
    });

    res.json({ message: "Excavation team assigned and project created.", tender, project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not assign the excavation team." });
  }
});

// POST /api/tenders/admin/bids/:bidId/reject -> reject a single bid outright
router.post("/admin/bids/:bidId/reject", requireRole("admin"), async (req, res) => {
  const bid = await TenderBid.findById(req.params.bidId);
  if (!bid) return res.status(404).json({ error: "Bid not found." });
  if (bid.status !== "Pending") {
    return res.status(400).json({ error: "Only a pending bid can be rejected." });
  }
  bid.status = "Rejected";
  bid.reviewed_by = req.user._id;
  bid.reviewed_at = new Date();
  bid.review_notes = req.body.notes || "";
  await bid.save();

  await notify({
    user: bid.team,
    category: "tender",
    type: "tender.bid.rejected",
    title: "Your bid was rejected",
    message: `The Government/Admin rejected your bid.${bid.review_notes ? ` Note: ${bid.review_notes}` : ""}`,
    link: "/et/bids",
  });

  res.json({ message: "Bid rejected.", bid });
});

// ===========================================================================
// Ahad_23201016 - EXCAVATION TEAM: browse tenders, bid, edit, withdraw
// ===========================================================================

// GET /api/tenders/open -> available tenders, each annotated with my own bid
router.get("/open", requireRole("excavation_team"), async (req, res) => {
  const tenders = await Tender.find({ status: "Open" })
    .populate("archaeologist", "name nid")
    .sort("deadline")
    .lean();

  const myBids = await TenderBid.find({
    team: req.user._id,
    tender: { $in: tenders.map((t) => t._id) },
  }).lean();
  const byTender = Object.fromEntries(myBids.map((b) => [String(b.tender), b]));

  const counts = await TenderBid.aggregate([
    { $match: { status: { $ne: "Withdrawn" } } },
    { $group: { _id: "$tender", count: { $sum: 1 } } },
  ]);
  const countByTender = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.json({
    tenders: tenders.map((t) => ({
      ...t,
      bid_count: countByTender[String(t._id)] || 0,
      my_bid: byTender[String(t._id)] || null,
      bidding_open: new Date(t.deadline).getTime() > Date.now(),
    })),
  });
});

// GET /api/tenders/my-bids -> this team's full bidding history
router.get("/my-bids", requireRole("excavation_team"), async (req, res) => {
  const bids = await TenderBid.find({ team: req.user._id })
    .populate({
      path: "tender",
      select: "title deadline estimated_budget status location project_details",
    })
    .sort("-submitted_at");
  res.json({ bids });
});

// GET /api/tenders/my-projects -> digs this team has been assigned
router.get("/my-projects", requireRole("excavation_team"), async (req, res) => {
  const projects = await ExcavationProject.find({ excavation_team: req.user._id })
    .populate("site", "name latitude longitude s_district")
    .populate("lead_archaeologist", "name nid email phone")
    .populate("artifacts")
    .sort("-createdAt");
  res.json({
    ongoing_projects: projects.filter((p) => !p.end_date),
    past_projects: projects.filter((p) => p.end_date),
  });
});

// POST /api/tenders/:id/bids -> submit a bid (cost, timeline, proposal)
router.post("/:id/bids", requireRole("excavation_team"), async (req, res) => {
  try {
    const { cost, timeline_days, proposal } = req.body;
    if (cost == null || timeline_days == null || !proposal) {
      return res.status(400).json({ error: "Cost, timeline, and proposal are all required." });
    }
    if (Number(cost) < 0) return res.status(400).json({ error: "Cost cannot be negative." });
    if (Number(timeline_days) < 1) {
      return res.status(400).json({ error: "Timeline must be at least one day." });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: "Tender not found." });
    if (!biddingOpen(tender)) {
      return res.status(400).json({ error: "Bidding on this tender has closed." });
    }

    const existing = await TenderBid.findOne({ tender: tender._id, team: req.user._id });
    if (existing && existing.status !== "Withdrawn") {
      return res.status(409).json({ error: "You have already bid on this tender. Edit that bid instead." });
    }

    // A withdrawn bid gets reopened rather than duplicated, so the unique
    // (tender, team) index still holds.
    if (existing) {
      existing.cost = Number(cost);
      existing.timeline_days = Number(timeline_days);
      existing.proposal = proposal;
      existing.status = "Pending";
      existing.company_name = companyOf(req.user);
      await existing.save();
      await announceBid(tender, req.user, existing, req.user._id);
      return res.status(201).json({ bid: existing });
    }

    const bid = await TenderBid.create({
      tender: tender._id,
      team: req.user._id,
      company_name: companyOf(req.user),
      cost: Number(cost),
      timeline_days: Number(timeline_days),
      proposal,
    });

    await announceBid(tender, req.user, bid, req.user._id);

    res.status(201).json({ bid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit the bid." });
  }
});

// PATCH /api/tenders/bids/:bidId -> edit my bid, only while the tender is open
router.patch("/bids/:bidId", requireRole("excavation_team"), async (req, res) => {
  const bid = await TenderBid.findOne({ _id: req.params.bidId, team: req.user._id }).populate("tender");
  if (!bid) return res.status(404).json({ error: "Bid not found." });
  if (bid.status === "Accepted" || bid.status === "Rejected") {
    return res.status(400).json({ error: "This bid has already been reviewed and cannot be changed." });
  }
  if (!biddingOpen(bid.tender)) {
    return res.status(400).json({ error: "The deadline has passed, so this bid can no longer be edited." });
  }

  const { cost, timeline_days, proposal } = req.body;
  if (cost != null) bid.cost = Number(cost);
  if (timeline_days != null) bid.timeline_days = Number(timeline_days);
  if (proposal != null) bid.proposal = proposal;
  bid.status = "Pending";
  await bid.save();

  res.json({ message: "Bid updated.", bid });
});

// DELETE /api/tenders/bids/:bidId -> withdraw my bid before the deadline
router.delete("/bids/:bidId", requireRole("excavation_team"), async (req, res) => {
  const bid = await TenderBid.findOne({ _id: req.params.bidId, team: req.user._id }).populate("tender");
  if (!bid) return res.status(404).json({ error: "Bid not found." });
  if (bid.status === "Accepted") {
    return res.status(400).json({ error: "A winning bid cannot be withdrawn." });
  }
  if (!biddingOpen(bid.tender)) {
    return res.status(400).json({ error: "The deadline has passed, so this bid can no longer be withdrawn." });
  }

  bid.status = "Withdrawn";
  await bid.save();
  res.json({ message: "Bid withdrawn.", bid });
});

// ===========================================================================
// Ahad_23201016 - SHARED PROJECT WORKSPACE
// The lead archaeologist, the assigned excavation team, and the admin all read
// the same project record - each just sees the actions their role allows.
// ===========================================================================

async function loadProjectFor(req, res) {
  const project = await ExcavationProject.findById(req.params.id)
    .populate("site")
    .populate("lead_archaeologist", "name nid email phone roleProfile.affiliation")
    .populate("excavation_team", TEAM_FIELDS)
    .populate("artifacts")
    .populate("tender", "title deadline estimated_budget requirements project_details")
    .populate("discoveryReport");

  if (!project) {
    res.status(404).json({ error: "Project not found." });
    return null;
  }

  const isAdmin = req.user.role === "admin";
  const isLead = String(project.lead_archaeologist?._id || project.lead_archaeologist) === String(req.user._id);
  const isTeam = String(project.excavation_team?._id || project.excavation_team) === String(req.user._id);

  if (!isAdmin && !isLead && !isTeam) {
    res.status(403).json({ error: "You are not part of this excavation project." });
    return null;
  }

  return { project, isAdmin, isLead, isTeam };
}

// GET /api/tenders/projects/:id -> full detail view for a single project
router.get("/projects/:id", async (req, res) => {
  const loaded = await loadProjectFor(req, res);
  if (!loaded) return;
  const { project, isAdmin, isLead, isTeam } = loaded;

  res.json({
    project: { ...project.toObject(), excavation_team: serializeTeam(project.excavation_team) },
    // Ahad_23201016 - the excavation team has read-only access to the project;
    // only the lead archaeologist records progress, artifacts and handover.
    permissions: { isAdmin, isLead, isTeam, canEdit: isLead && !project.end_date },
  });
});

// POST /api/tenders/projects/:id/artifacts
// The "Add Artifact" flow from Smart Artifact Search, moved into the project.
// The discovery location is taken from the project itself, never from the
// client, so every find is pinned to where the report actually came from.
router.post("/projects/:id/artifacts", async (req, res) => {
  try {
    const loaded = await loadProjectFor(req, res);
    if (!loaded) return;
    const { project, isLead } = loaded;

    if (!isLead) {
      return res.status(403).json({ error: "Only the lead archaeologist can add artifacts." });
    }
    if (project.end_date) {
      return res.status(400).json({ error: "This project has been completed and handed over." });
    }

    const { name, description, discovery_date, Type, civilization, era, region, material, usage, picture } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Artifact name is required." });
    }

    const item = await Item.create({
      site: project.site?._id || project.site,
      name: String(name).trim(),
      description: description || "",
      picture: picture || "",
      discovery_date: discovery_date || new Date(),
      Type: Type || "other",
      civilization: civilization || "",
      era: era || "",
      region: region || "",
      material: material || "",
      usage: usage || "",
      // Held back from the public catalogue until the admin allocates it.
      location: "Pending Allocation",
      allocation: "Unallocated",
      pending_allocation: true,
      excavationProject: project._id,
    });

    // Atomic push - the loaded doc has `artifacts` populated, so mutating it
    // in place and calling save() would try to write whole sub-documents back.
    await ExcavationProject.updateOne({ _id: project._id }, { $push: { artifacts: item._id } });

    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add the artifact." });
  }
});

// PATCH /api/tenders/projects/:id/artifacts/:itemId -> fix up a find
router.patch("/projects/:id/artifacts/:itemId", async (req, res) => {
  const loaded = await loadProjectFor(req, res);
  if (!loaded) return;
  const { project, isLead } = loaded;

  if (!isLead) return res.status(403).json({ error: "Only the lead archaeologist can edit artifacts." });
  if (project.end_date) return res.status(400).json({ error: "This project has been completed." });

  const item = await Item.findOne({ _id: req.params.itemId, excavationProject: project._id });
  if (!item) return res.status(404).json({ error: "Artifact not found on this project." });
  if (!item.pending_allocation) {
    return res.status(400).json({ error: "This artifact has already been allocated by the Government." });
  }

  const allowed = ["name", "description", "Type", "civilization", "era", "region", "material", "usage", "picture", "discovery_date"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }
  await item.save();
  res.json({ item });
});

// DELETE /api/tenders/projects/:id/artifacts/:itemId
router.delete("/projects/:id/artifacts/:itemId", async (req, res) => {
  const loaded = await loadProjectFor(req, res);
  if (!loaded) return;
  const { project, isLead } = loaded;

  if (!isLead) return res.status(403).json({ error: "Only the lead archaeologist can remove artifacts." });
  if (project.end_date) return res.status(400).json({ error: "This project has been completed." });

  const item = await Item.findOne({ _id: req.params.itemId, excavationProject: project._id });
  if (!item) return res.status(404).json({ error: "Artifact not found on this project." });
  if (!item.pending_allocation) {
    return res.status(400).json({ error: "This artifact has already been allocated by the Government." });
  }

  await Item.deleteOne({ _id: item._id });
  await ExcavationProject.updateOne({ _id: project._id }, { $pull: { artifacts: item._id } });

  res.json({ message: "Artifact removed." });
});

// PATCH /api/tenders/projects/:id/progress
router.patch("/projects/:id/progress", async (req, res) => {
  const loaded = await loadProjectFor(req, res);
  if (!loaded) return;
  const { project, isLead } = loaded;

  if (!isLead) return res.status(403).json({ error: "Only the lead archaeologist can update progress." });
  if (project.end_date) return res.status(400).json({ error: "This project has been completed." });

  const allowedProgress = ["Just Started", "In Progress", "Almost Done", "Stalled"];
  if (!allowedProgress.includes(req.body.progress)) {
    return res.status(400).json({ error: "Unknown progress value." });
  }

  await ExcavationProject.updateOne({ _id: project._id }, { progress: req.body.progress });
  res.json({ message: "Progress updated.", progress: req.body.progress });
});

// POST /api/tenders/projects/:id/complete
// Ends the dig and hands the recovered artifacts to the Government/Admin,
// who then decides where each one goes (museum storage or auction).
router.post("/projects/:id/complete", async (req, res) => {
  const loaded = await loadProjectFor(req, res);
  if (!loaded) return;
  const { project, isLead } = loaded;

  if (!isLead) return res.status(403).json({ error: "Only the lead archaeologist can close this project." });
  if (project.end_date) return res.status(400).json({ error: "This project is already complete." });

  const finishedAt = new Date();
  await ExcavationProject.updateOne(
    { _id: project._id },
    {
      end_date: finishedAt,
      completed_at: finishedAt,
      progress: "Almost Done",
      submitted_to_admin: true,
      completion_notes: req.body.notes || "",
    }
  );
  const updated = await ExcavationProject.findById(project._id);

  // Notification: closure report is with the Government, artifacts need allocating.
  await notifyAdmins({
    category: "request",
    type: "project.closure.submitted",
    title: "Excavation closed - artifacts awaiting allocation",
    message: `"${project.p_name}" has been completed by ${req.user.name}. ${project.artifacts?.length || 0} artifact(s) need a destination.`,
    link: `/admin/excavation-projects/${project._id}`,
    dashboardKey: "excavation_projects",
    actionRequired: true,
  }, [req.user._id]);

  // Keep the other half of the project team in the loop.
  await notifyMany(
    [project.lead_archaeologist?._id || project.lead_archaeologist, project.excavation_team?._id || project.excavation_team],
    {
      category: "assignment",
      type: "project.completed",
      title: "Excavation project closed",
      message: `"${project.p_name}" has been marked complete and handed over to the Government/Admin.`,
      link: `/arc/projects/${project._id}`,
    },
    [req.user._id]
  );

<<<<<<< Updated upstream
  // Cross Feedback & Performance Review System: whichever side didn't click
  // "Complete" gets asked to rate the other. The person who just completed it
  // gets their own rating prompt immediately in the UI (see ProjectDetail.jsx).
  const otherPartyId =
    req.user.role === "archaeologist"
      ? project.excavation_team?._id || project.excavation_team
      : project.lead_archaeologist?._id || project.lead_archaeologist;

  if (otherPartyId) {
    // Falls back to "assignment" if this server's Notification schema hasn't
    // picked up the "review" category yet, so the notification always gets
    // sent even if that file update was missed.
    const reviewCategory = Notification.CATEGORIES?.includes("review") ? "review" : "assignment";
    const sent = await notify({
      user: otherPartyId,
      category: reviewCategory,
      type: "review.requested",
      title: "Report submitted, rate your partner",
      message: `The excavation "${project.p_name}" is complete. Share a rating and feedback about your partner.`,
      link: `/reviews/${project._id}`,
      actionRequired: true,
    });
    if (!sent) {
      console.error(
        `[reviews] could not notify ${otherPartyId} to rate project ${project._id} - check that Notification.js includes the "review" category.`
      );
    }
  }
=======
  // Cross Feedback & Performance Review System: both sides are asked to rate
  // each other. The person who clicked "Complete" also sees the rating popup
  // inline straight away (see ProjectDetail.jsx), but they still get the
  // notification - dismissing that popup with "Maybe later" would otherwise
  // leave them no way back to it.
  await sendReviewRequests(updated);
>>>>>>> Stashed changes

  res.json({
    message: "Project completed and submitted to the Government for artifact allocation.",
    project: updated,
  });
});

module.exports = router;
