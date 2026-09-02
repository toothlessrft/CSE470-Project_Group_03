const express = require("express");
const User = require("../models/User");
const Site = require("../models/Site");
const ExcavationRequest = require("../models/ExcavationRequest");
const ExcavationProject = require("../models/ExcavationProject");
const ItemRequest = require("../models/ItemRequest");
const ToolRentalRequest = require("../models/ToolRentalRequest");
const DiscoveryReport = require("../models/DiscoveryReport");
const ResearcherReport = require("../models/ResearcherReport"); // Report Approval & Artifact Allocation
const Item = require("../models/Item"); // Report Approval & Artifact Allocation
const { requireAuth, requireRole } = require("../middleware/auth");
const { MUSEUMS, normalizeMuseumName } = require("../config/museums");
const Tender = require("../models/Tender");
const TenderBid = require("../models/TenderBid");
const Auction = require("../models/Auction");
const { notify, notifyAdmins } = require("../services/notify"); // Role-Based Notification & Reminder System

// Haversine distance in km, used to suggest researchers near a report's location
function distanceKm(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/dashboard  (was /admin/dashboard)
router.get("/dashboard", async (req, res) => {
  res.json({
    admin: {
      nid: req.user.nid,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      profile_pic: req.user.profile_pic,
      administration: req.user.roleProfile?.administration,
    },
  });
});

// GET /api/admin/work-summary
// Live outstanding-work counts, one per Admin Dashboard card. These drive the
// red circles on the dashboard.
//
// Deliberately counted from the source records rather than from unread
// notifications: a badge has to mean "this many things still need you", so it
// must not clear just because someone glanced at the page, and it has to grow
// the moment a new record lands. Reading a notification and doing the work are
// two different things.
router.get("/work-summary", async (req, res) => {
  try {
    const now = new Date();

    const [
      unassignedReports,
      tendersWithBids,
      projectsAwaitingAllocation,
      pendingItemRequests,
      pendingToolRequests,
      excavationRequests,
      pendingUsers,
      activeAuctions,
    ] = await Promise.all([
      // Discoveries with nobody assigned yet - exactly what the "Pending" tab
      // on Field Reports shows by default. Final researcher reports awaiting
      // approval live under that same page's "Verified" tab rather than a
      // count of their own, so they're deliberately not added in here - a
      // badge has to match what you see the moment you land on the page.
      DiscoveryReport.countDocuments({ status: "Pending" }),
      // Open tenders that have at least one bid still to be judged
      TenderBid.distinct("tender", { status: "Pending" }).then(async (ids) =>
        ids.length ? Tender.countDocuments({ _id: { $in: ids }, status: "Open" }) : 0
      ),
      // Completed digs whose finds still need a destination. Requires at
      // least one artifact so a completed project with nothing recovered
      // (or one that only exists to anchor a review, never a real dig) can't
      // sit flagged as "awaiting allocation" forever with nothing to do.
      ExcavationProject.countDocuments({
        submitted_to_admin: true,
        allocation_done: false,
        "artifacts.0": { $exists: true },
      }),
      ItemRequest.countDocuments({ approval_status: "Pending" }),
      // Same query the Equipment Inventory page's own "Requests" tab uses by
      // default (routes/inventory.js GET /requests, filtered client-side) -
      // this used to be overdue-equipment instead, a different number than
      // what that tab actually shows on load.
      ToolRentalRequest.countDocuments({ approval_status: "Pending" }),
      ExcavationRequest.countDocuments({}),
      User.countDocuments({ status: "pending" }),
      Auction.countDocuments({ status: "Active" }),
    ]);

    res.json({
      counts: {
        field_reports: unassignedReports,
        tenders: tendersWithBids,
        excavation_projects: projectsAwaitingAllocation,
        item_requests: pendingItemRequests,
        tool_requests: pendingToolRequests,
        tool_inventory: pendingToolRequests,
        excavation_requests: excavationRequests,
        pending_users: pendingUsers,
        auctions: activeAuctions,
        // "Approved Requests" is a read-only archive - nothing is ever
        // outstanding there, so it carries no badge by design.
        approved_requests: 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load the dashboard work summary." });
  }
});

// ---- Item requests (museum loans) ----------------------------------------

// GET /api/admin/item-requests  (was /admin/approve_item_request GET)
router.get("/item-requests", async (req, res) => {
  const pending = await ItemRequest.find({ approval_status: "Pending" })
    .populate("museum_manager", "name")
    .populate("item", "name");
  res.json({ pending_requests: pending });
});

// POST /api/admin/item-requests/:id  (was /admin/approve_item_request POST)
router.post("/item-requests/:id", async (req, res) => {
  const { action } = req.body;
  if (action === "approve") {
    const request = await ItemRequest.findByIdAndUpdate(
      req.params.id,
      { approval_status: "Approved", admin: req.user._id },
      { new: true }
    ).populate("item", "name");

    // Notification: museum authority hears back on their loan request.
    // No "Go to page" here - there's no page showing this manager's own
    // request history (the request itself is gone once approved; it's now
    // just an allocated item), so a link would only lead somewhere unrelated.
    await notify({
      user: request?.museum_manager,
      category: "request",
      type: "item.request.approved",
      title: "Item request approved",
      message: `Your request for "${request?.item?.name || "an artifact"}" has been approved by the Government/Admin.`,
    });

    // Notification: logged under Approved Requests for the whole admin desk.
    await notifyAdmins({
      category: "request",
      type: "item.request.recorded",
      title: "Item request approved",
      message: `"${request?.item?.name || "An artifact"}" was approved for museum loan by ${req.user.name}.`,
      link: "/admin/approved-requests",
      dashboardKey: "approved_requests",
    });

    return res.json({ message: "Item request approved successfully!" });
  }
  if (action === "deny") {
    // Read it before deleting so we still know who to tell.
    const request = await ItemRequest.findById(req.params.id).populate("item", "name");
    await ItemRequest.findByIdAndDelete(req.params.id);

    await notify({
      user: request?.museum_manager,
      category: "request",
      type: "item.request.denied",
      title: "Item request denied",
      message: `Your request for "${request?.item?.name || "an artifact"}" was not approved.`,
    });

    return res.json({ message: "Item request denied and deleted!" });
  }
  res.status(400).json({ error: "Unknown action." });
});

// ---- Tool rental requests ---------------------------------------------------

// GET /api/admin/tool-requests  (was /admin/approve_tool_request GET)
router.get("/tool-requests", async (req, res) => {
  const pending = await ToolRentalRequest.find({ approval_status: "Pending" })
    .populate("user", "name")
    .populate("tool", "type model_no");
  res.json({ pending_requests: pending });
});

// POST /api/admin/tool-requests/:id  (was /admin/approve_tool_request POST)
router.post("/tool-requests/:id", async (req, res) => {
  const { action } = req.body;
  if (action === "approve") {
    const request = await ToolRentalRequest.findByIdAndUpdate(
      req.params.id,
      { approval_status: "Approved", admin: req.user._id, decided_at: new Date() },
      { new: true }
    ).populate("tool", "model_no type");

    await notify({
      user: request?.user,
      category: "request",
      type: "tool.request.approved",
      title: "Equipment request approved",
      message: `${request?.tool ? `${request.tool.type} (${request.tool.model_no})` : "Your requested equipment"} has been assigned to you.`,
      link: "/equipment",
    });

    await notifyAdmins({
      category: "request",
      type: "tool.request.recorded",
      title: "Equipment request approved",
      message: `${request?.tool ? `${request.tool.type} (${request.tool.model_no})` : "Equipment"} was approved by ${req.user.name}.`,
      link: "/admin/approved-requests",
      dashboardKey: "approved_requests",
    });

    return res.json({ message: "Tool request approved successfully!" });
  }
  if (action === "deny") {
    const request = await ToolRentalRequest.findById(req.params.id).populate("tool", "model_no type");
    await ToolRentalRequest.findByIdAndDelete(req.params.id);

    await notify({
      user: request?.user,
      category: "request",
      type: "tool.request.denied",
      title: "Equipment request denied",
      message: `Your request for ${request?.tool ? `${request.tool.type} (${request.tool.model_no})` : "equipment"} was not approved.`,
      link: "/equipment",
    });

    return res.json({ message: "Tool request denied and deleted!" });
  }
  res.status(400).json({ error: "Unknown action." });
});

// ---- Approved requests overview -------------------------------------------

// GET /api/admin/approved-requests  (was /admin/view_approved_requests)
router.get("/approved-requests", async (req, res) => {
  const [items, tools] = await Promise.all([
    ItemRequest.find({ approval_status: "Approved" })
      .populate("museum_manager", "name")
      .populate("item", "name")
      .populate("admin", "name"),
    ToolRentalRequest.find({ approval_status: "Approved" })
      .populate("user", "name")
      .populate("tool", "type")
      .populate("admin", "name"),
  ]);
  res.json({
    approved_item_requests: items,
    approved_tool_requests: tools,
  });
});

// ---- Excavation requests ----------------------------------------------------

// GET /api/admin/excavation-requests  (was /admin/manage_excavation_requests)
router.get("/excavation-requests", async (req, res) => {
  const requests = await ExcavationRequest.find()
    .populate("archaeologist", "name")
    .populate("site", "name");
  res.json({ requests });
});

// GET /api/admin/excavation-requests/:id  (was /admin/excavation_request/<site_id>/<archeologist>)
router.get("/excavation-requests/:id", async (req, res) => {
  const request = await ExcavationRequest.findById(req.params.id)
    .populate("archaeologist", "name")
    .populate("site");
  if (!request) return res.status(404).json({ error: "Request not found." });
  res.json({ request_data: request });
});

// POST /api/admin/excavation-requests/:id  (approve -> creates project, deny -> deletes)
router.post("/excavation-requests/:id", async (req, res) => {
  const { action } = req.body;
  const request = await ExcavationRequest.findById(req.params.id).populate("site");
  if (!request) return res.status(404).json({ error: "Request not found." });

  if (action === "approve") {
    await ExcavationProject.create({
      p_name: `Project ${request.site.name}`,
      organization: "Government",
      start_date: new Date(),
      end_date: null,
      progress: "Just Started",
      lead_archaeologist: request.archaeologist,
      site: request.site._id,
      budget: request.budget,
    });
  }

  await ExcavationRequest.findByIdAndDelete(req.params.id);

  // Notification: excavation request status back to the archaeologist.
  await notify({
    user: request.archaeologist,
    category: "request",
    type: action === "approve" ? "excavation.request.approved" : "excavation.request.denied",
    title: action === "approve" ? "Excavation request approved" : "Excavation request denied",
    message:
      action === "approve"
        ? `Your excavation proposal for ${request.site?.name || "the site"} was approved and a project has been created.`
        : `Your excavation proposal for ${request.site?.name || "the site"} was not approved.`,
    link: "/arc/projects",
  });

  res.json({ message: action === "approve" ? "Request approved, project created." : "Request denied." });
});

// ---- Artifact discovery reports / Field inspection assignment -------------

// GET /api/admin/reports?status=Pending -> list discovery reports (any/all statuses)
router.get("/reports", async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const reports = await DiscoveryReport.find(filter)
    .populate("reporter", "name nid email phone")
    .populate("assignment.researcher", "name nid")
    .sort("-createdAt");
  res.json({ reports });
});

// GET /api/admin/reports/:id -> single report detail
router.get("/reports/:id", async (req, res) => {
  const report = await DiscoveryReport.findById(req.params.id)
    .populate("reporter", "name nid email phone")
    .populate("assignment.researcher", "name nid email");
  if (!report) return res.status(404).json({ error: "Report not found." });
  res.json({ report });
});

// GET /api/admin/researchers?lat=..&lng=.. -> archaeologists, nearest first
router.get("/researchers", async (req, res) => {
  const { lat, lng } = req.query;
  const reportLoc = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;

  const researchers = await User.find({ role: "archaeologist" }).select(
    "nid name email roleProfile.affiliation roleProfile.location"
  );

  const withDistance = researchers.map((r) => ({
    _id: r._id,
    nid: r.nid,
    name: r.name,
    email: r.email,
    affiliation: r.roleProfile?.affiliation || "",
    distance_km: distanceKm(reportLoc, r.roleProfile?.location),
  }));

  withDistance.sort((a, b) => {
    if (a.distance_km == null && b.distance_km == null) return a.name.localeCompare(b.name);
    if (a.distance_km == null) return 1;
    if (b.distance_km == null) return -1;
    return a.distance_km - b.distance_km;
  });

  res.json({ researchers: withDistance });
});

// POST /api/admin/reports/:id/assign -> assign a researcher for field inspection
router.post("/reports/:id/assign", async (req, res) => {
  try {
    const { researcher_id, budget, notes, due_date } = req.body;
    if (!researcher_id || !due_date) {
      return res.status(400).json({ error: "A researcher and a report-by date are required." });
    }

    const report = await DiscoveryReport.findByIdAndUpdate(
      req.params.id,
      {
        status: "Assigned",
        assignment: {
          researcher: researcher_id,
          budget: budget || undefined,
          notes: notes || "",
          due_date,
          assigned_by: req.user._id,
          assigned_at: new Date(),
        },
      },
      { new: true }
    )
      .populate("assignment.researcher", "name nid email")
      .populate("reporter", "name nid email phone");

    if (!report) return res.status(404).json({ error: "Report not found." });

    // Notification: action-required alert for the researcher, plus a status
    // update for whoever originally logged the discovery.
    await notify({
      user: researcher_id,
      category: "assignment",
      type: "inspection.assigned",
      title: "New field inspection assigned",
      message: `You have been assigned to inspect the ${report.material} discovery at ${report.location?.address || "the reported location"}. Report due ${new Date(due_date).toLocaleDateString()}.`,
      link: "/arc/assignments",
      actionRequired: true,
      deadlineAt: due_date,
      meta: { reportId: report._id },
    });

    await notify({
      user: report.reporter?._id || report.reporter,
      category: "report",
      type: "report.assigned",
      title: "Your discovery report is being inspected",
      message: "A researcher has been assigned to verify the artifact you reported.",
      link: "/my-reports",
    });

    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not assign field inspection." });
  }
});

// ---- Researcher Report Approval & Artifact Allocation ----------------------

// GET /api/admin/researcher-reports/:discoveryId -> researcher report for a discovery, with any allocated items
router.get("/researcher-reports/:discoveryId", async (req, res) => {
  const report = await ResearcherReport.findOne({ discoveryReport: req.params.discoveryId })
    .populate("researcher", "name nid email")
    .populate("adminReview.reviewedBy", "name")
    .populate("allocatedItems");
  if (!report) return res.status(404).json({ error: "Researcher report not found." });

  // Ahad_23201016 - so the field report page can show the published tender
  // instead of offering to publish a second one for the same report.
  const tender = await Tender.findOne({ fieldReport: report._id, status: { $ne: "Cancelled" } })
    .select("title status deadline estimated_budget")
    .sort("-createdAt");

  res.json({ report, tender: tender || null });
});

// POST /api/admin/researcher-reports/:discoveryId/approve
// Approves a final (Pending) researcher report. Every artifact the researcher
// listed is added straight to the artifact catalogue (Smart Artifact Search),
// unallocated until the admin sends it to a museum or to auction below.
router.post("/researcher-reports/:discoveryId/approve", async (req, res) => {
  try {
    const report = await ResearcherReport.findOne({ discoveryReport: req.params.discoveryId }).populate(
      "discoveryReport"
    );
    if (!report) return res.status(404).json({ error: "Researcher report not found." });
    if (report.status !== "Pending") {
      return res.status(400).json({ error: "Only a submitted report awaiting review can be approved." });
    }

    const createdItems = await Item.create(
      report.artifacts.map((a) => ({
        name: a.name,
        description: a.description,
        Type: a.Type,
        civilization: a.civilization,
        era: a.era,
        region: a.region,
        material: a.material,
        usage: a.usage,
        picture: a.picture,
        discovery_date: report.discoveryReport?.verification?.submitted_at || new Date(),
        location: "Pending Allocation",
      }))
    );

    report.status = "Approved";
    report.adminReview = { reviewedBy: req.user._id, reviewedAt: new Date(), notes: req.body.notes || "" };
    report.allocatedItems = createdItems.map((i) => i._id);
    await report.save();

    // Populate before sending back so the frontend gets real Item objects
    // (with a real _id, name, Type, etc.) instead of bare ObjectId strings -
    // otherwise every artifact card ends up sharing the same "undefined" key.
    await report.populate("allocatedItems");

    // Notification: acceptance of the researcher's field report.
    await notify({
      user: report.researcher,
      category: "report",
      type: "researcher.report.approved",
      title: "Your field report was approved",
      message: `${createdItems.length} artifact(s) from your report have been added to the national catalogue.${req.body.notes ? ` Note: ${req.body.notes}` : ""}`,
      link: "/arc/assignments",
    });

    res.json({ message: "Report approved and artifacts added to the catalogue.", report, items: createdItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not approve report." });
  }
});

// POST /api/admin/artifacts/:itemId/allocate -> send a discovered artifact to museum storage or auction
router.post("/artifacts/:itemId/allocate", async (req, res) => {
  const { destination, museumName } = req.body;
  if (!["Museum", "Auction"].includes(destination)) {
    return res.status(400).json({ error: "destination must be 'Museum' or 'Auction'." });
  }
  if (destination === "Museum") {
    const cleanMuseumName = normalizeMuseumName(museumName);
    if (!cleanMuseumName || !MUSEUMS.includes(cleanMuseumName)) {
      return res.status(400).json({ error: "Please choose a valid recognized museum from the list." });
    }
  }

  const destinationLabel = destination === "Museum" ? normalizeMuseumName(museumName) : "Auction";

  // Museum Collection & Artifact Inventory Management (Feature 12): fetch +
  // .save() instead of findByIdAndUpdate, so the model's pre("save") hook
  // runs and back-fills a unique artifactId on any older item that doesn't
  // have one yet (findByIdAndUpdate silently skips document middleware).
  const item = await Item.findById(req.params.itemId);
  if (!item) return res.status(404).json({ error: "Artifact not found." });

  item.allocation = destination;
  item.museumName = destination === "Museum" ? normalizeMuseumName(museumName) : "";
  item.location = destinationLabel;
  item.availability = destination === "Museum" ? "In Storage" : "Transferred";
  // Ahad_23201016 - artifacts recovered on an excavation project are held
  // back from Smart Artifact Search until this moment. Allocating one
  // releases it into the public catalogue; sending it to Auction also makes
  // it show up as a candidate in Manage Auctions.
  item.pending_allocation = false;
  // Being allocated is itself a status/location change worth logging.
  item.movementHistory.push({
    action: "Allocated",
    status: item.availability,
    location: destinationLabel,
    note:
      destination === "Museum"
        ? `Allocated to ${destinationLabel} by the Government/Admin`
        : "Sent to auction by the Government/Admin",
    by: req.user._id,
  });
  await item.save();

  // Ahad_23201016 - once every find from a completed dig has a destination,
  // flag the project itself as fully allocated.
  if (item.excavationProject) {
    const stillPending = await Item.countDocuments({
      excavationProject: item.excavationProject,
      pending_allocation: true,
    });
    await ExcavationProject.findByIdAndUpdate(item.excavationProject, {
      allocation_done: stillPending === 0,
    });
  }

  // Notification: artifact transfer alert for the receiving museum authority.
  if (destination === "Museum") {
    const cleanMuseumName = normalizeMuseumName(museumName);
    const curators = await User.find({
      role: "museum_manager",
      status: "approved",
      "roleProfile.museum_name": cleanMuseumName,
    }).select("_id");

    for (const curator of curators) {
      await notify({
        user: curator._id,
        category: "assignment",
        type: "artifact.allocated",
        title: "Artifact allocated to your museum",
        message: `"${item.name}" has been transferred to ${cleanMuseumName} by the Government/Admin.`,
        link: "/mm/my-museum-items",
        actionRequired: true,
      });
    }
  }

  res.json({ message: "Allocation updated.", item });
});

module.exports = router;
