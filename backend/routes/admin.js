const express = require("express");
const User = require("../models/User");
const Site = require("../models/Site");
const ExcavationRequest = require("../models/ExcavationRequest");
const ExcavationProject = require("../models/ExcavationProject");
const ItemRequest = require("../models/ItemRequest");
const RequestMaintenance = require("../models/RequestMaintenance");
const ToolRentalRequest = require("../models/ToolRentalRequest");
const DiscoveryReport = require("../models/DiscoveryReport");
const ResearcherReport = require("../models/ResearcherReport"); // Report Approval & Artifact Allocation
const Item = require("../models/Item"); // Report Approval & Artifact Allocation
const { requireAuth, requireRole } = require("../middleware/auth");

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
    await ItemRequest.findByIdAndUpdate(req.params.id, {
      approval_status: "Approved",
      admin: req.user._id,
    });
    return res.json({ message: "Item request approved successfully!" });
  }
  if (action === "deny") {
    await ItemRequest.findByIdAndDelete(req.params.id);
    return res.json({ message: "Item request denied and deleted!" });
  }
  res.status(400).json({ error: "Unknown action." });
});

// ---- Maintenance requests --------------------------------------------------

// GET /api/admin/maintenance-requests  (was /admin/approve_maintenance_request GET)
router.get("/maintenance-requests", async (req, res) => {
  const pending = await RequestMaintenance.find({ status: "Pending" })
    .populate("site", "name")
    .populate("caretaker", "name");
  res.json({ pending_requests: pending });
});

// POST /api/admin/maintenance-requests/:id  (was /admin/approve_maintenance_request POST)
router.post("/maintenance-requests/:id", async (req, res) => {
  const { action, approved_budget } = req.body;
  if (action === "approve" && approved_budget) {
    await RequestMaintenance.findByIdAndUpdate(req.params.id, {
      status: "Approved",
      approved_budget,
      admin: req.user._id,
    });
    return res.json({ message: "Maintenance request approved successfully!" });
  }
  if (action === "deny") {
    await RequestMaintenance.findByIdAndDelete(req.params.id);
    return res.json({ message: "Maintenance request denied and deleted!" });
  }
  res.status(400).json({ error: "Unknown action or missing approved_budget." });
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
    await ToolRentalRequest.findByIdAndUpdate(req.params.id, {
      approval_status: "Approved",
      admin: req.user._id,
    });
    return res.json({ message: "Tool request approved successfully!" });
  }
  if (action === "deny") {
    await ToolRentalRequest.findByIdAndDelete(req.params.id);
    return res.json({ message: "Tool request denied and deleted!" });
  }
  res.status(400).json({ error: "Unknown action." });
});

// ---- Approved requests overview -------------------------------------------

// GET /api/admin/approved-requests  (was /admin/view_approved_requests)
router.get("/approved-requests", async (req, res) => {
  const [items, maintenance, tools] = await Promise.all([
    ItemRequest.find({ approval_status: "Approved" })
      .populate("museum_manager", "name")
      .populate("item", "name")
      .populate("admin", "name"),
    RequestMaintenance.find({ status: "Approved" })
      .populate("site", "name")
      .populate("caretaker", "name")
      .populate("admin", "name"),
    ToolRentalRequest.find({ approval_status: "Approved" })
      .populate("user", "name")
      .populate("tool", "type")
      .populate("admin", "name"),
  ]);
  res.json({
    approved_item_requests: items,
    approved_maintenance_requests: maintenance,
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
  res.json({ report });
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
  if (destination === "Museum" && !museumName) {
    return res.status(400).json({ error: "Museum name is required." });
  }

  const item = await Item.findByIdAndUpdate(
    req.params.itemId,
    {
      allocation: destination,
      museumName: destination === "Museum" ? museumName : "",
      location: destination === "Museum" ? museumName : "Scheduled for Auction",
    },
    { new: true }
  );
  if (!item) return res.status(404).json({ error: "Artifact not found." });
  res.json({ message: "Allocation updated.", item });
});

module.exports = router;
