// Demo notifications, so no account opens the bell to an empty panel.
//
// Rule: a sample may only describe a record that really exists, and its link
// must lead to a page showing it. Everything here is built from live queries
// and skipped when the record is missing; anything that cannot be tied to a
// record becomes a general notice pointing at a list page.
//
// Built lazily on the first notification read rather than in seed.js, because
// a reseed gives accounts new _ids. Each dedupe_key embeds the account and
// record id, so the unique index stops duplicates.
const Notification = require("../models/Notification");
const Auction = require("../models/Auction");
const Exhibition = require("../models/Exhibition");
const DiscoveryReport = require("../models/DiscoveryReport");
const ResearcherReport = require("../models/ResearcherReport");
const ExcavationProject = require("../models/ExcavationProject");
const ExcavationRequest = require("../models/ExcavationRequest");
const ArtifactLoan = require("../models/ArtifactLoan");
const ItemRequest = require("../models/ItemRequest");
const ToolRentalRequest = require("../models/ToolRentalRequest");
const Tender = require("../models/Tender");
const TenderBid = require("../models/TenderBid");
const Item = require("../models/Item");
const User = require("../models/User");

const HOUR = 60 * 60 * 1000;
const MIN_SAMPLES = 6;

function money(n) {
  return n == null ? "-" : `BDT ${Number(n).toLocaleString()}`;
}

function shortDate(d) {
  return d ? new Date(d).toLocaleDateString() : "";
}

// --- per-role builders, each returning samples for real records ------------

async function forPublic(user) {
  const out = [];

  const auctions = await Auction.find({ status: "Active" })
    .populate("item", "name")
    .sort({ deadline: 1 })
    .limit(2);

  auctions.forEach((a, i) => {
    const name = a.item?.name || "an artifact";
    if (i === 0) {
      out.push({
        slug: `auction-ending-${a._id}`,
        category: "reminder",
        type: "auction.ending",
        title: "Auction closing soon",
        message: `Bidding on "${name}" closes ${new Date(a.deadline).toLocaleString()}. Current bid ${money(a.current_bid ?? a.starting_bid)}.`,
        link: `/auctions/${a._id}`,
        deadline_at: a.deadline,
        ageHours: 3,
      });
    } else {
      out.push({
        slug: `auction-live-${a._id}`,
        category: "auction",
        type: "auction.wishlist.listed",
        title: "An artifact you can bid on is live",
        message: `"${name}" is open for bidding, starting at ${money(a.starting_bid)}.`,
        link: `/auctions/${a._id}`,
        actionRequired: true,
        deadline_at: a.deadline,
        ageHours: 11,
      });
    }
  });

  const exhibitions = await Exhibition.find({ status: "published" }).sort({ start_date: 1 }).limit(2);
  exhibitions.forEach((e, i) => {
    out.push({
      slug: `exhibition-${e._id}`,
      category: "event",
      type: i === 0 ? "exhibition.nearby" : "exhibition.published",
      title: i === 0 ? "New event near you" : "New exhibition announced",
      message: `"${e.title}"${e.museum_name ? ` at ${e.museum_name}` : ""} runs from ${shortDate(e.start_date)}.`,
      link: "/exhibitions",
      deadline_at: e.start_date,
      ageHours: 26 + i * 9,
    });
  });

  // Only mention their reports if they filed any.
  const reports = await DiscoveryReport.find({ reporter: user._id }).sort("-createdAt").limit(2);
  reports.forEach((r, i) => {
    const verified = r.status === "Verified";
    out.push({
      slug: `report-${r._id}`,
      category: "report",
      type: verified ? "report.verified" : "report.assigned",
      title: verified ? "Your discovery was verified" : `Your discovery report is ${r.status.toLowerCase()}`,
      message: verified
        ? `A researcher confirmed the ${r.material} you reported. Thank you for helping preserve heritage.`
        : `Your report of a ${r.material} find is currently marked ${r.status}.`,
      link: "/my-reports",
      read: i > 0,
      ageHours: 48 + i * 20,
    });
  });

  return out;
}

async function forArchaeologist(user) {
  const out = [];

  const assigned = await DiscoveryReport.find({
    "assignment.researcher": user._id,
    status: "Assigned",
  })
    .sort("-assignment.assigned_at")
    .limit(2);

  assigned.forEach((r) => {
    out.push({
      slug: `inspection-${r._id}`,
      category: "assignment",
      type: "inspection.assigned",
      title: "Field inspection assigned to you",
      message: `You are assigned to inspect a ${r.material} discovery at ${r.location?.address || "the reported location"}.${r.assignment?.due_date ? ` Report due ${shortDate(r.assignment.due_date)}.` : ""}`,
      link: "/arc/assignments",
      actionRequired: true,
      deadline_at: r.assignment?.due_date || null,
      ageHours: 4,
    });
  });

  const reports = await ResearcherReport.find({ researcher: user._id }).sort("-updatedAt").limit(2);
  reports.forEach((r, i) => {
    const approved = r.status === "Approved";
    out.push({
      slug: `field-report-${r._id}`,
      category: "report",
      type: approved ? "researcher.report.approved" : "researcher.report.submitted",
      title: approved ? "Your field report was approved" : `Your field report is ${r.status.toLowerCase()}`,
      message: approved
        ? `${r.artifacts?.length || 0} artifact(s) from your report were added to the national catalogue.`
        : `Your field report with ${r.artifacts?.length || 0} artifact(s) is currently ${r.status}.`,
      link: "/arc/assignments",
      read: i > 0,
      ageHours: 20 + i * 14,
    });
  });

  const projects = await ExcavationProject.find({ lead_archaeologist: user._id })
    .populate("site", "name")
    .sort("-createdAt")
    .limit(2);

  projects.forEach((p, i) => {
    out.push({
      slug: `project-${p._id}`,
      category: "assignment",
      type: "project.team.assigned",
      title: p.end_date ? "Excavation project closed" : "You are lead on an active excavation",
      message: `"${p.p_name}"${p.site?.name ? ` at ${p.site.name}` : ""} is ${p.end_date ? "complete" : `in progress (${p.progress || "ongoing"})`}.`,
      link: `/arc/projects/${p._id}`,
      actionRequired: !p.end_date && i === 0,
      ageHours: 30 + i * 16,
    });
  });

  const tools = await ToolRentalRequest.find({ user: user._id })
    .populate("tool", "type model_no")
    .sort("-createdAt")
    .limit(2);

  tools.forEach((t, i) => {
    const label = t.tool ? `${t.tool.type} (${t.tool.model_no})` : "Equipment";
    out.push({
      slug: `tool-${t._id}`,
      category: "request",
      type: `tool.request.${t.approval_status.toLowerCase()}`,
      title: `Equipment request ${t.approval_status.toLowerCase()}`,
      message: `${t.quantity ?? 1} x ${label} - ${t.approval_status}. Return date ${shortDate(t.end_date)}.`,
      link: "/equipment",
      actionRequired: t.approval_status === "Approved" && !t.returned_at,
      deadline_at: t.approval_status === "Approved" && !t.returned_at ? t.end_date : null,
      read: i > 0,
      ageHours: 26 + i * 12,
    });
  });

  return out;
}

async function forMuseumManager(user) {
  const out = [];

  // Loans into this museum.
  const incoming = await ArtifactLoan.find({ lending_museum: user._id })
    .populate("item", "name")
    .populate("requesting_museum", "name roleProfile.museum_name")
    .sort("-request_date")
    .limit(2);

  incoming.forEach((loan) => {
    const pending = loan.status === "Pending";
    const asker =
      loan.requesting_museum?.roleProfile?.museum_name || loan.requesting_museum?.name || "Another museum";
    out.push({
      slug: `loan-in-${loan._id}`,
      category: "request",
      type: pending ? "loan.request.received" : "loan.request.decided",
      title: pending ? "Artifact loan request awaiting your decision" : `Loan request ${loan.status.toLowerCase()}`,
      message: `${asker} asked to borrow "${loan.item?.name || "an artifact"}" for ${loan.exhibition_name}.`,
      link: "/mm/incoming-loans",
      actionRequired: pending,
      deadline_at: pending ? loan.start_date : null,
      ageHours: 5,
    });
  });

  const outgoing = await ArtifactLoan.find({ requesting_museum: user._id })
    .populate("item", "name")
    .sort("-request_date")
    .limit(2);

  outgoing.forEach((loan, i) => {
    out.push({
      slug: `loan-out-${loan._id}`,
      category: "request",
      type: `loan.request.${loan.status.toLowerCase()}`,
      title: `Your loan request is ${loan.status.toLowerCase()}`,
      message: `"${loan.item?.name || "An artifact"}" for ${loan.exhibition_name} - ${loan.status}. Loan period ends ${shortDate(loan.end_date)}.`,
      link: "/mm/my-loans",
      actionRequired: loan.status === "Approved" && !loan.returned_at,
      deadline_at: loan.status === "Approved" ? loan.end_date : null,
      read: i > 0,
      ageHours: 18 + i * 10,
    });
  });

  const museumName = user.roleProfile?.museum_name;
  if (museumName) {
    const artifacts = await Item.find({ allocation: "Museum", museumName }).sort("-updatedAt").limit(1);
    artifacts.forEach((item) => {
      out.push({
        slug: `artifact-${item._id}`,
        category: "assignment",
        type: "artifact.allocated",
        title: "Artifact allocated to your museum",
        message: `"${item.name}" is held by ${museumName}. Review its catalogue entry and storage details.`,
        link: "/mm/my-museum-items",
        ageHours: 22,
      });
    });
  }

  const exhibitions = await Exhibition.find({ museum_manager: user._id }).sort({ start_date: 1 }).limit(2);
  exhibitions.forEach((e, i) => {
    out.push({
      slug: `exhibition-own-${e._id}`,
      category: e.status === "published" ? "reminder" : "event",
      type: "exhibition.starting",
      title: e.status === "published" ? "Your exhibition is published" : `Your exhibition is a ${e.status}`,
      message: `"${e.title}" runs ${shortDate(e.start_date)} to ${shortDate(e.end_date)}.`,
      link: "/mm/exhibitions",
      deadline_at: e.start_date,
      read: i > 0,
      ageHours: 14 + i * 11,
    });
  });

  const itemRequests = await ItemRequest.find({ museum_manager: user._id })
    .populate("item", "name")
    .sort("-request_date")
    .limit(2);

  itemRequests.forEach((r, i) => {
    out.push({
      slug: `item-req-${r._id}`,
      category: "request",
      type: `item.request.${r.approval_status.toLowerCase()}`,
      title: `Item request ${r.approval_status.toLowerCase()}`,
      message: `Your request for "${r.item?.name || "an artifact"}" is ${r.approval_status}.`,
      // No link: there is no page listing this manager's own requests.
      read: i > 0,
      ageHours: 34 + i * 9,
    });
  });

  return out;
}

async function forExcavationTeam(user) {
  const out = [];

  const tenders = await Tender.find({ status: "Open" }).sort({ deadline: 1 }).limit(2);
  tenders.forEach((t, i) => {
    out.push({
      slug: `tender-${t._id}`,
      category: i === 0 ? "tender" : "reminder",
      type: i === 0 ? "tender.published" : "tender.deadline",
      title: i === 0 ? "Excavation tender open for bids" : "Tender deadline approaching",
      message: `"${t.title}" - estimated budget ${money(t.estimated_budget)}, bids close ${new Date(t.deadline).toLocaleString()}.`,
      link: "/et/tenders",
      actionRequired: true,
      deadline_at: t.deadline,
      ageHours: 4 + i * 6,
    });
  });

  const bids = await TenderBid.find({ team: user._id })
    .populate("tender", "title")
    .sort("-submitted_at")
    .limit(3);

  bids.forEach((b, i) => {
    const accepted = b.status === "Accepted";
    out.push({
      slug: `bid-${b._id}`,
      category: "tender",
      type: `tender.bid.${b.status.toLowerCase()}`,
      title: accepted ? "Your bid won the tender" : `Your bid is ${b.status.toLowerCase()}`,
      message: `${money(b.cost)} over ${b.timeline_days} days on "${b.tender?.title || "a tender"}" - ${b.status}.`,
      link: "/et/bids",
      actionRequired: accepted,
      read: i > 1,
      ageHours: 20 + i * 12,
    });
  });

  const projects = await ExcavationProject.find({ excavation_team: user._id })
    .populate("site", "name")
    .sort("-createdAt")
    .limit(2);

  projects.forEach((p, i) => {
    out.push({
      slug: `et-project-${p._id}`,
      category: "assignment",
      type: p.end_date ? "project.completed" : "project.team.assigned",
      title: p.end_date ? "Excavation project closed" : "Active excavation assigned to your team",
      message: `"${p.p_name}"${p.site?.name ? ` at ${p.site.name}` : ""} - ${p.end_date ? "completed" : p.progress || "in progress"}.`,
      link: `/et/projects/${p._id}`,
      actionRequired: !p.end_date && i === 0,
      ageHours: 28 + i * 15,
    });
  });

  const tools = await ToolRentalRequest.find({ user: user._id })
    .populate("tool", "type model_no")
    .sort("-createdAt")
    .limit(1);

  tools.forEach((t) => {
    const label = t.tool ? `${t.tool.type} (${t.tool.model_no})` : "Equipment";
    out.push({
      slug: `et-tool-${t._id}`,
      category: "request",
      type: `tool.request.${t.approval_status.toLowerCase()}`,
      title: `Equipment request ${t.approval_status.toLowerCase()}`,
      message: `${t.quantity ?? 1} x ${label} - ${t.approval_status}.`,
      link: "/equipment",
      ageHours: 24,
    });
  });

  return out;
}

async function forAdmin() {
  const out = [];

  const unassigned = await DiscoveryReport.find({ status: "Pending" }).sort("-createdAt").limit(2);
  unassigned.forEach((r) => {
    out.push({
      slug: `admin-report-${r._id}`,
      category: "report",
      type: "discovery.report.submitted",
      title: "Discovery report awaiting a researcher",
      message: `A ${r.material} find was reported at ${r.location?.address || "an unnamed location"}. Assign a researcher for field inspection.`,
      link: `/admin/reports/${r._id}`,
      dashboardKey: "field_reports",
      actionRequired: true,
      ageHours: 3,
    });
  });

  const toReview = await ResearcherReport.find({ status: "Pending" }).sort("-updatedAt").limit(1);
  toReview.forEach((r) => {
    out.push({
      slug: `admin-field-report-${r._id}`,
      category: "report",
      type: "researcher.report.submitted",
      title: "Field report submitted for review",
      message: `A field report with ${r.artifacts?.length || 0} artifact(s) is waiting on your approval.`,
      link: r.discoveryReport ? `/admin/reports/${r.discoveryReport}` : "/admin/reports",
      dashboardKey: "field_reports",
      actionRequired: true,
      ageHours: 9,
    });
  });

  const pendingBidIds = await TenderBid.distinct("tender", { status: "Pending" });
  const liveTenders = pendingBidIds.length
    ? await Tender.find({ _id: { $in: pendingBidIds }, status: "Open" }).limit(2)
    : [];
  for (const t of liveTenders) {
    const count = await TenderBid.countDocuments({ tender: t._id, status: "Pending" });
    out.push({
      slug: `admin-tender-${t._id}`,
      category: "tender",
      type: "tender.bid.submitted",
      title: "Bids waiting on a tender",
      message: `"${t.title}" has ${count} bid(s) to review. Bidding closes ${shortDate(t.deadline)}.`,
      link: `/admin/tenders/${t._id}`,
      dashboardKey: "tenders",
      actionRequired: true,
      deadline_at: t.deadline,
      ageHours: 6,
    });
  }

  const awaiting = await ExcavationProject.find({ submitted_to_admin: true, allocation_done: false }).limit(1);
  awaiting.forEach((p) => {
    out.push({
      slug: `admin-project-${p._id}`,
      category: "request",
      type: "project.closure.submitted",
      title: "Excavation closed - artifacts awaiting allocation",
      message: `"${p.p_name}" was handed over with ${p.artifacts?.length || 0} artifact(s) needing a destination.`,
      link: `/admin/excavation-projects/${p._id}`,
      dashboardKey: "excavation_projects",
      actionRequired: true,
      ageHours: 12,
    });
  });

  const itemReqs = await ItemRequest.find({ approval_status: "Pending" })
    .populate("item", "name")
    .populate("museum_manager", "name roleProfile.museum_name")
    .limit(1);

  itemReqs.forEach((r) => {
    out.push({
      slug: `admin-item-req-${r._id}`,
      category: "request",
      type: "item.request.submitted",
      title: "Museum item request awaiting approval",
      message: `${r.museum_manager?.roleProfile?.museum_name || r.museum_manager?.name || "A museum"} requested "${r.item?.name || "an artifact"}".`,
      link: "/admin/item-requests",
      dashboardKey: "item_requests",
      actionRequired: true,
      ageHours: 16,
    });
  });

  const toolReqs = await ToolRentalRequest.find({ approval_status: "Pending" })
    .populate("tool", "type model_no")
    .populate("user", "name")
    .limit(1);

  toolReqs.forEach((r) => {
    out.push({
      slug: `admin-tool-req-${r._id}`,
      category: "request",
      type: "tool.request.submitted",
      title: "Equipment request awaiting approval",
      message: `${r.user?.name || "A team"} requested ${r.quantity ?? 1} x ${r.tool ? `${r.tool.type} (${r.tool.model_no})` : "equipment"}.`,
      link: "/admin/tool-inventory",
      dashboardKey: "tool_requests",
      actionRequired: true,
      ageHours: 19,
    });
  });

  const excReqs = await ExcavationRequest.find({})
    .populate("archaeologist", "name")
    .populate("site", "name")
    .limit(1);

  excReqs.forEach((r) => {
    out.push({
      slug: `admin-exc-req-${r._id}`,
      category: "request",
      type: "excavation.request.submitted",
      title: "Excavation proposal awaiting review",
      message: `${r.archaeologist?.name || "An archaeologist"} proposed a dig at ${r.site?.name || "a site"} with a budget of ${money(r.budget)}.`,
      link: "/admin/excavation-requests",
      dashboardKey: "excavation_requests",
      actionRequired: true,
      ageHours: 27,
    });
  });

  const waitingUsers = await User.find({ status: "pending" }).limit(1);
  waitingUsers.forEach((u) => {
    out.push({
      slug: `admin-user-${u._id}`,
      category: "account",
      type: "user.registration.pending",
      title: "Registration awaiting approval",
      message: `${u.name} registered as ${String(u.role).replace("_", " ")} and is waiting for approval.`,
      link: "/admin/pending-users",
      dashboardKey: "pending_users",
      actionRequired: true,
      ageHours: 5,
    });
  });

  const auctions = await Auction.find({ status: "Active" })
    .populate("item", "name")
    .sort({ deadline: 1 })
    .limit(2);

  auctions.forEach((a, i) => {
    out.push({
      slug: `admin-auction-${a._id}`,
      category: "auction",
      type: "auction.bid.placed",
      title: a.bid_count ? "Bidding activity on an auction" : "Auction is live with no bids yet",
      message: `"${a.item?.name || "An artifact"}" - ${a.bid_count || 0} bid(s), currently ${money(a.current_bid ?? a.starting_bid)}, closes ${shortDate(a.deadline)}.`,
      link: `/auctions/${a._id}`,
      dashboardKey: "auctions",
      deadline_at: a.deadline,
      read: i > 0,
      ageHours: 8 + i * 7,
    });
  });

  return out;
}

// Where each role's own dashboard lives, for the general notices below.
const ROLE_HOME = {
  public: "/public/dashboard",
  archaeologist: "/arc/dashboard",
  museum_manager: "/mm/dashboard",
  excavation_team: "/et/dashboard",
  admin: "/admin/dashboard",
};

// Padding notices. They never name a record, so they cannot point at an empty
// page. More than MIN_SAMPLES of them, so an empty database still fills up.
function generalNotices(user) {
  const isAdmin = user.role === "admin";
  const home = ROLE_HOME[user.role] || "/";
  return [
    {
      slug: "welcome",
      category: "account",
      type: "account.welcome",
      title: "Welcome to ArchiveEarth",
      message:
        "Your account is active. Notifications about approvals, deadlines, auctions and events will appear here.",
      link: isAdmin ? "/admin/dashboard" : "/",
      read: true,
      ageHours: 96,
    },
    {
      slug: "digest",
      category: "account",
      type: "system.digest",
      title: "Heritage operations digest",
      message: isAdmin
        ? "Review outstanding approvals from the cards above. Each red count shows work still waiting on you."
        : "Browse the artifact catalogue, upcoming exhibitions, and open auctions from the top navigation.",
      link: isAdmin ? "/admin/dashboard" : "/search",
      ageHours: 60,
    },
    {
      slug: "auctions-open",
      category: "auction",
      type: "auction.browse",
      title: "Auctions are open",
      message: "Artifacts released by the Government are listed for bidding. Browse the current lots.",
      link: "/auctions",
      read: true,
      ageHours: 72,
    },
    {
      slug: "events-open",
      category: "event",
      type: "exhibition.browse",
      title: "Exhibitions and events",
      message: "Museums publish exhibitions, educational tours and cultural events here.",
      link: "/exhibitions",
      read: true,
      ageHours: 84,
    },
    {
      slug: "report-discovery",
      category: "report",
      type: "report.browse",
      title: isAdmin ? "Discovery reports" : "Found something? Report it",
      message: isAdmin
        ? "Public discovery reports arrive here for researcher assignment and verification."
        : "Log a newly discovered artifact and the Government will assign a researcher to verify it.",
      link: isAdmin ? "/admin/reports" : "/report-discovery",
      read: true,
      ageHours: 100,
    },
    {
      slug: "knowledge-hub",
      category: "account",
      type: "knowledge.browse",
      title: "Knowledge Hub",
      message: "Articles, records and reference material on Bangladesh's heritage are collected here.",
      link: "/knowledge",
      read: true,
      ageHours: 108,
    },
    {
      slug: "your-dashboard",
      category: "account",
      type: "account.dashboard",
      title: "Your dashboard",
      message: "Everything available to your role is gathered on your dashboard.",
      link: home,
      read: true,
      ageHours: 120,
    },
  ];
}

const BUILDERS = {
  public: forPublic,
  archaeologist: forArchaeologist,
  museum_manager: forMuseumManager,
  excavation_team: forExcavationTeam,
  admin: forAdmin,
};

// Accounts already built in this process. A reseed gives new _ids, which miss
// the cache and rebuild on their own.
const verified = new Set();

async function ensureDemoNotifications(user) {
  try {
    if (!user?._id) return;
    const userId = String(user._id);
    if (verified.has(userId)) return;

    // Rebuild rather than top up: an earlier batch may point at an exhibition
    // or auction since deleted, and topping up would never clear those. This
    // way a plain server restart is enough to fix them.
    await Notification.deleteMany({ user: user._id, demo: true });

    const builder = BUILDERS[user.role] || forPublic;
    let samples = await builder(user);

    // Pad to the minimum with general notices.
    if (samples.length < MIN_SAMPLES) {
      samples = samples.concat(generalNotices(user).slice(0, MIN_SAMPLES - samples.length));
    }
    if (!samples.length) {
      verified.add(userId);
      return;
    }

    const now = Date.now();
    const docs = samples.map((s) => ({
      user: user._id,
      role: user.role,
      category: s.category,
      type: s.type,
      title: s.title,
      message: s.message,
      link: s.link || "",
      action_required: Boolean(s.actionRequired),
      read: Boolean(s.read),
      read_at: s.read ? new Date(now - (s.ageHours || 1) * HOUR) : null,
      deadline_at: s.deadline_at || null,
      dashboard_key: s.dashboardKey || "",
      dedupe_key: `sample:${userId}:${s.slug}`,
      demo: true,
      meta: { sample: true },
    }));

    await Notification.insertMany(docs, { ordered: false }).catch((err) => {
      if (err?.code !== 11000 && !err?.writeErrors) throw err;
    });

    // Mongoose stamps createdAt, so backdate afterwards to spread out the
    // "3h ago" labels. Cosmetic only, hence its own try/catch.
    const backdateOps = samples
      .filter((s) => s.ageHours)
      .map((s) => ({
        updateOne: {
          filter: { dedupe_key: `sample:${userId}:${s.slug}` },
          update: { $set: { createdAt: new Date(now - s.ageHours * HOUR) } },
        },
      }));

    if (backdateOps.length > 0) {
      try {
        await Notification.collection.bulkWrite(backdateOps, { ordered: false });
      } catch (backdateErr) {
        console.error("[sample-notifications] backdating timestamps failed (non-fatal):", backdateErr.message);
      }
    }

    verified.add(userId);
  } catch (err) {
    // Never let demo data break a real request.
    console.error("[sample-notifications] could not build samples:", err.message);
  }
}

module.exports = { ensureDemoNotifications, MIN_SAMPLES };
