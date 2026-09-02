// Request Excavation Tools & Field Equipment + Inventory Tracking
//
// Who may request: the lead archaeologist of an active excavation project, or
// the excavation team assigned to one. Anyone else gets a 403 - "selected"
// archaeologists and teams only.
//
// Availability is always derived (quantity_total minus everything approved and
// not yet returned) rather than stored, so this router and the older
// /api/admin/tool-requests screen can never drift apart on stock levels.
const express = require("express");
const Tool = require("../models/Tool");
const ToolRentalRequest = require("../models/ToolRentalRequest");
const ExcavationProject = require("../models/ExcavationProject");
const { requireAuth, requireRole } = require("../middleware/auth");
const { notify, notifyAdmins } = require("../services/notify");

const router = express.Router();
router.use(requireAuth);

// Older builds carried a unique index on (user, tool), which blocked a team
// from taking the same tool to a second dig. Drop it once at boot; the catch
// covers the normal case where it was never created.
ToolRentalRequest.collection
  .dropIndex("user_1_tool_1")
  .then(() => console.log("[inventory] removed legacy unique (user, tool) index"))
  .catch(() => {});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Units currently out on assignment, keyed by tool id. */
async function outOnAssignment() {
  const rows = await ToolRentalRequest.aggregate([
    { $match: { approval_status: "Approved", returned_at: null } },
    { $group: { _id: "$tool", units: { $sum: { $ifNull: ["$quantity", 1] } } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.units]));
}

/** Units sitting in open (pending) requests, keyed by tool id. */
async function pendingUnits() {
  const rows = await ToolRentalRequest.aggregate([
    { $match: { approval_status: "Pending" } },
    { $group: { _id: "$tool", units: { $sum: { $ifNull: ["$quantity", 1] } } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.units]));
}

async function serializeTools(tools) {
  const [assigned, pending] = await Promise.all([outOnAssignment(), pendingUnits()]);

  return tools.map((t) => {
    const doc = t.toObject ? t.toObject() : t;
    const total = doc.quantity_total ?? 1;
    const out = assigned[String(doc._id)] || 0;
    const inService = doc.status === "In Service";
    return {
      ...doc,
      quantity_total: total,
      assigned_units: out,
      pending_units: pending[String(doc._id)] || 0,
      available_units: inService ? Math.max(total - out, 0) : 0,
      requestable: inService && Math.max(total - out, 0) > 0,
    };
  });
}

/**
 * Projects the current user may raise equipment requests against: active digs
 * where they are the lead archaeologist or the assigned excavation team.
 */
async function eligibleProjects(user) {
  if (user.role === "archaeologist") {
    return ExcavationProject.find({ lead_archaeologist: user._id, end_date: null })
      .populate("site", "name s_district")
      .sort("-createdAt");
  }
  if (user.role === "excavation_team") {
    return ExcavationProject.find({ excavation_team: user._id, end_date: null })
      .populate("site", "name s_district")
      .sort("-createdAt");
  }
  return [];
}

function describeTool(tool) {
  if (!tool) return "Equipment";
  return `${tool.type} (${tool.model_no})`;
}

// ---------------------------------------------------------------------------
// Catalogue - readable by any logged-in user
// ---------------------------------------------------------------------------

// GET /api/inventory/tools?category=&available=true&q=
router.get("/tools", async (req, res) => {
  try {
    const { category, available, q } = req.query;

    const filter = {};
    if (category && category !== "all") filter.category = category;
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ type: rx }, { model_no: rx }, { owner: rx }];
    }

    const tools = await Tool.find(filter).sort({ category: 1, type: 1 });
    let serialized = await serializeTools(tools);
    if (available === "true") serialized = serialized.filter((t) => t.requestable);

    res.json({ tools: serialized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load the equipment inventory." });
  }
});

// GET /api/inventory/my-projects -> the active zones I can request equipment for
router.get("/my-projects", async (req, res) => {
  const projects = await eligibleProjects(req.user);
  res.json({
    projects: projects.map((p) => ({
      _id: p._id,
      p_name: p.p_name,
      site_name: p.site?.name || "",
      district: p.site?.s_district || "",
      progress: p.progress,
    })),
    can_request: projects.length > 0,
  });
});

// ---------------------------------------------------------------------------
// Requests - archaeologists and excavation teams
// ---------------------------------------------------------------------------

// GET /api/inventory/requests/mine
router.get("/requests/mine", async (req, res) => {
  const requests = await ToolRentalRequest.find({ user: req.user._id })
    .populate("tool", "model_no type owner category hazard")
    .populate("project", "p_name")
    .sort("-createdAt");
  res.json({ requests });
});

// POST /api/inventory/requests
// { tool_id, project_id, quantity, start_date, end_date, purpose }
router.post("/requests", requireRole("archaeologist", "excavation_team"), async (req, res) => {
  try {
    const { tool_id, project_id, quantity, start_date, end_date, purpose } = req.body;

    if (!tool_id || !project_id || !start_date || !end_date || !purpose) {
      return res.status(400).json({
        error: "Equipment, project, both dates, and a purpose are all required.",
      });
    }
    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ error: "The return date must be after the collection date." });
    }

    // Only the lead archaeologist / assigned team of an active dig may request.
    const projects = await eligibleProjects(req.user);
    const project = projects.find((p) => String(p._id) === String(project_id));
    if (!project) {
      return res.status(403).json({
        error: "You can only request equipment for an active project you lead or are assigned to.",
      });
    }

    const tool = await Tool.findById(tool_id);
    if (!tool) return res.status(404).json({ error: "Equipment not found." });
    if (tool.status !== "In Service") {
      return res.status(400).json({ error: `${describeTool(tool)} is currently marked ${tool.status}.` });
    }

    const units = Math.max(parseInt(quantity, 10) || 1, 1);

    const [serialized] = await serializeTools([tool]);
    if (units > serialized.available_units) {
      return res.status(400).json({
        error: `Only ${serialized.available_units} unit(s) of ${describeTool(tool)} are available right now.`,
      });
    }

    const duplicate = await ToolRentalRequest.findOne({
      user: req.user._id,
      tool: tool._id,
      project: project._id,
      approval_status: "Pending",
    });
    if (duplicate) {
      return res.status(409).json({
        error: "You already have a pending request for this equipment on this project.",
      });
    }

    const request = await ToolRentalRequest.create({
      user: req.user._id,
      tool: tool._id,
      project: project._id,
      quantity: units,
      start_date,
      end_date,
      purpose,
      approval_status: "Pending",
    });

    // Action-required alert for the Government/Admin desk.
    await notifyAdmins({
      category: "request",
      type: "tool.request.submitted",
      title: "New equipment request",
      message: `${req.user.name} requested ${units} x ${describeTool(tool)} for "${project.p_name}" from ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}.`,
      link: "/admin/tool-inventory",
      dashboardKey: "tool_requests",
      actionRequired: true,
      meta: { requestId: request._id },
    });

    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit the equipment request." });
  }
});

// DELETE /api/inventory/requests/:id -> withdraw my own pending request
router.delete("/requests/:id", async (req, res) => {
  const request = await ToolRentalRequest.findOne({ _id: req.params.id, user: req.user._id });
  if (!request) return res.status(404).json({ error: "Request not found." });
  if (request.approval_status !== "Pending") {
    return res.status(400).json({ error: "Only a pending request can be withdrawn." });
  }

  await ToolRentalRequest.deleteOne({ _id: request._id });
  res.json({ message: "Request withdrawn." });
});

// POST /api/inventory/requests/:id/return -> borrower checks the kit back in
router.post("/requests/:id/return", async (req, res) => {
  const request = await ToolRentalRequest.findOne({ _id: req.params.id, user: req.user._id }).populate(
    "tool",
    "model_no type"
  );
  if (!request) return res.status(404).json({ error: "Request not found." });
  if (request.approval_status !== "Approved") {
    return res.status(400).json({ error: "Only approved equipment can be returned." });
  }
  if (request.returned_at) return res.status(400).json({ error: "This equipment is already returned." });

  request.returned_at = new Date();
  request.return_notes = req.body?.notes || "";
  await request.save();

  await notifyAdmins({
    category: "request",
    type: "tool.returned",
    title: "Equipment returned",
    message: `${req.user.name} returned ${request.quantity} x ${describeTool(request.tool)}.`,
    link: "/admin/tool-inventory",
    dashboardKey: "tool_inventory",
  });

  res.json({ message: "Equipment marked as returned.", request });
});

// ---------------------------------------------------------------------------
// Government/Admin - manage the inventory and assign equipment
// ---------------------------------------------------------------------------

// GET /api/inventory/requests?status=Pending
router.get("/requests", requireRole("admin"), async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== "all") filter.approval_status = req.query.status;
  if (req.query.outstanding === "true") {
    filter.approval_status = "Approved";
    filter.returned_at = null;
  }

  const requests = await ToolRentalRequest.find(filter)
    .populate("user", "name role email phone roleProfile.company_name roleProfile.organization")
    .populate("tool", "model_no type owner category hazard quantity_total")
    .populate("project", "p_name progress")
    .sort("-createdAt");

  res.json({ requests });
});

// GET /api/inventory/assignments -> what is out, grouped by active zone
router.get("/assignments", requireRole("admin"), async (req, res) => {
  const rentals = await ToolRentalRequest.find({ approval_status: "Approved", returned_at: null })
    .populate("user", "name role")
    .populate("tool", "model_no type category")
    .populate("project", "p_name end_date")
    .sort("end_date");

  const zones = new Map();
  for (const r of rentals) {
    const key = r.project ? String(r.project._id) : "unassigned";
    if (!zones.has(key)) {
      zones.set(key, {
        project_id: r.project?._id || null,
        zone: r.project?.p_name || "Unassigned",
        active: r.project ? !r.project.end_date : false,
        items: [],
      });
    }
    zones.get(key).items.push({
      _id: r._id,
      tool: r.tool ? { _id: r.tool._id, label: describeTool(r.tool), category: r.tool.category } : null,
      quantity: r.quantity ?? 1,
      holder: r.user?.name || "Unknown",
      holder_role: r.user?.role || "",
      start_date: r.start_date,
      end_date: r.end_date,
      overdue: new Date(r.end_date) < new Date(),
    });
  }

  res.json({ zones: [...zones.values()] });
});

// POST /api/inventory/requests/:id/decision  { action: approve|deny, note }
router.post("/requests/:id/decision", requireRole("admin"), async (req, res) => {
  try {
    const { action, note } = req.body || {};
    if (!["approve", "deny"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'deny'." });
    }

    const request = await ToolRentalRequest.findById(req.params.id)
      .populate("tool")
      .populate("project", "p_name");
    if (!request) return res.status(404).json({ error: "Request not found." });
    if (request.approval_status !== "Pending") {
      return res.status(400).json({ error: "This request has already been decided." });
    }

    const toolLabel = describeTool(request.tool);
    const projectName = request.project?.p_name || "your project";

    if (action === "approve") {
      const [serialized] = await serializeTools([request.tool]);
      if ((request.quantity ?? 1) > serialized.available_units) {
        return res.status(400).json({
          error: `Only ${serialized.available_units} unit(s) of ${toolLabel} are left in stock.`,
        });
      }

      request.approval_status = "Approved";
      request.admin = req.user._id;
      request.decision_note = note || "";
      request.decided_at = new Date();
      await request.save();

      await notifyAdmins({
        category: "request",
        type: "tool.request.recorded",
        title: "Equipment request approved",
        message: `${request.quantity} x ${toolLabel} was approved for "${projectName}" by ${req.user.name}.`,
        link: "/admin/approved-requests",
        dashboardKey: "approved_requests",
      });

      await notify({
        user: request.user,
        category: "request",
        type: "tool.request.approved",
        title: "Equipment request approved",
        message: `${request.quantity} x ${toolLabel} is assigned to "${projectName}" until ${new Date(request.end_date).toLocaleDateString()}.${note ? ` Note: ${note}` : ""}`,
        link: "/equipment",
      });
    } else {
      request.approval_status = "Denied";
      request.admin = req.user._id;
      request.decision_note = note || "";
      request.decided_at = new Date();
      await request.save();

      await notify({
        user: request.user,
        category: "request",
        type: "tool.request.denied",
        title: "Equipment request denied",
        message: `Your request for ${request.quantity} x ${toolLabel} on "${projectName}" was not approved.${note ? ` Reason: ${note}` : ""}`,
        link: "/equipment",
      });
    }

    res.json({ message: `Request ${request.approval_status.toLowerCase()}.`, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not record the decision." });
  }
});

// POST /api/inventory/requests/:id/check-in -> admin closes out a rental
router.post("/requests/:id/check-in", requireRole("admin"), async (req, res) => {
  const request = await ToolRentalRequest.findById(req.params.id).populate("tool");
  if (!request) return res.status(404).json({ error: "Request not found." });
  if (request.approval_status !== "Approved") {
    return res.status(400).json({ error: "Only approved equipment can be checked in." });
  }
  if (request.returned_at) return res.status(400).json({ error: "This equipment is already returned." });

  request.returned_at = new Date();
  request.return_notes = req.body?.notes || "";
  await request.save();

  await notify({
    user: request.user,
    category: "request",
    type: "tool.checked.in",
    title: "Equipment checked in",
    message: `${describeTool(request.tool)} has been received back by the Government store.`,
    link: "/equipment",
  });

  res.json({ message: "Equipment checked in.", request });
});

// POST /api/inventory/tools -> add a new tool to the store
router.post("/tools", requireRole("admin"), async (req, res) => {
  try {
    const { model_no, type, owner } = req.body;
    if (!model_no || !type || !owner) {
      return res.status(400).json({ error: "Model number, type, and owner are required." });
    }

    const exists = await Tool.findOne({ model_no: model_no.trim() });
    if (exists) return res.status(409).json({ error: "That model number is already in the inventory." });

    const tool = await Tool.create({
      model_no: model_no.trim(),
      type: type.trim(),
      owner: owner.trim(),
      category: req.body.category || "Other",
      quantity_total: Math.max(parseInt(req.body.quantity_total, 10) || 1, 0),
      condition: req.body.condition || "Good",
      status: req.body.status || "In Service",
      home_location: req.body.home_location || "",
      insurance_info: req.body.insurance_info || "",
      hazard: req.body.hazard || "",
      notes: req.body.notes || "",
    });

    const [serialized] = await serializeTools([tool]);
    res.status(201).json({ tool: serialized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add the equipment." });
  }
});

// PATCH /api/inventory/tools/:id
router.patch("/tools/:id", requireRole("admin"), async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ error: "Equipment not found." });

    const allowed = [
      "type",
      "owner",
      "category",
      "condition",
      "status",
      "home_location",
      "insurance_info",
      "hazard",
      "notes",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) tool[key] = req.body[key];
    }

    if (req.body.quantity_total !== undefined) {
      const total = Math.max(parseInt(req.body.quantity_total, 10) || 0, 0);
      const assigned = (await outOnAssignment())[String(tool._id)] || 0;
      if (total < assigned) {
        return res.status(400).json({
          error: `${assigned} unit(s) are currently out on assignment, so the total cannot drop below that.`,
        });
      }
      tool.quantity_total = total;
    }

    await tool.save();
    const [serialized] = await serializeTools([tool]);
    res.json({ tool: serialized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update the equipment." });
  }
});

// DELETE /api/inventory/tools/:id -> only while nothing is out on assignment
router.delete("/tools/:id", requireRole("admin"), async (req, res) => {
  const tool = await Tool.findById(req.params.id);
  if (!tool) return res.status(404).json({ error: "Equipment not found." });

  const open = await ToolRentalRequest.countDocuments({
    tool: tool._id,
    $or: [{ approval_status: "Pending" }, { approval_status: "Approved", returned_at: null }],
  });
  if (open) {
    return res.status(400).json({
      error: "This equipment has open requests or units out on a dig - retire it instead of deleting.",
    });
  }

  await Tool.deleteOne({ _id: tool._id });
  res.json({ message: "Equipment removed from the inventory." });
});

module.exports = router;
