// Automatic deadline reminders. One sweeper runs on an interval and covers
// everything with a due date: tenders, field reports, auctions, equipment
// returns, artifact loans and exhibitions.
//
// Each reminder builds a deterministic dedupe_key, so re-running the sweep or
// restarting the server never produces duplicates.
const Tender = require("../models/Tender");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Wishlist = require("../models/Wishlist");
const DiscoveryReport = require("../models/DiscoveryReport");
const ToolRentalRequest = require("../models/ToolRentalRequest");
const ArtifactLoan = require("../models/ArtifactLoan");
const Exhibition = require("../models/Exhibition");
const User = require("../models/User");
const { notify, notifyMany, notifyRole } = require("./notify");

// One reminder per window. Taking only the tightest window means a deadline
// three days out gives "3 days left", then "1 day", then "6 hours" - not all
// three at once.
const WINDOWS = [
  { hours: 72, label: "in 3 days" },
  { hours: 24, label: "tomorrow" },
  { hours: 6, label: "in under 6 hours" },
];

const SWEEP_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes
const NEARBY_RADIUS_KM = 50;

// Tightest window this deadline falls inside, or null if it is past or still
// further out than the widest window.
function windowFor(deadline) {
  if (!deadline) return null;
  const msLeft = new Date(deadline).getTime() - Date.now();
  if (msLeft <= 0) return null;
  const hoursLeft = msLeft / (1000 * 60 * 60);

  let match = null;
  for (const w of WINDOWS) {
    if (hoursLeft <= w.hours && (!match || w.hours < match.hours)) match = w;
  }
  return match;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function money(n) {
  return n == null ? "-" : `BDT ${Number(n).toLocaleString()}`;
}

// --- individual sweeps -----------------------------------------------------

// Tender bidding deadlines -> every excavation team, plus the admin who owns it.
async function remindTenderDeadlines() {
  const tenders = await Tender.find({ status: "Open", deadline: { $gt: new Date() } });

  for (const tender of tenders) {
    const w = windowFor(tender.deadline);
    if (!w) continue;

    await notifyRole("excavation_team", {
      category: "reminder",
      type: "tender.deadline",
      title: `Tender closes ${w.label}`,
      message: `Bidding on "${tender.title}" closes ${new Date(tender.deadline).toLocaleString()}. Estimated budget ${money(tender.estimated_budget)}.`,
      link: "/et/tenders",
      deadlineAt: tender.deadline,
      dedupeKey: `tender-deadline:${tender._id}:${w.hours}`,
    });

    await notify({
      user: tender.created_by,
      category: "reminder",
      type: "tender.deadline.admin",
      title: `Tender closes ${w.label}`,
      message: `"${tender.title}" stops accepting bids ${new Date(tender.deadline).toLocaleString()}. Review the bids and award the tender.`,
      link: `/admin/tenders/${tender._id}`,
      dashboardKey: "tenders",
      deadlineAt: tender.deadline,
      dedupeKey: `tender-deadline-admin:${tender._id}:${w.hours}`,
    });
  }
}

// Field inspection report-by dates -> the assigned researcher.
async function remindFieldReportDeadlines() {
  const reports = await DiscoveryReport.find({
    status: "Assigned",
    "assignment.due_date": { $gt: new Date() },
    "assignment.researcher": { $ne: null },
  });

  for (const report of reports) {
    const w = windowFor(report.assignment.due_date);
    if (!w) continue;

    await notify({
      user: report.assignment.researcher,
      category: "reminder",
      type: "report.deadline",
      title: `Field report due ${w.label}`,
      message: `Your inspection report for the ${report.material} discovery at ${report.location?.address || "the reported location"} is due ${new Date(report.assignment.due_date).toLocaleDateString()}.`,
      link: "/arc/assignments",
      actionRequired: true,
      deadlineAt: report.assignment.due_date,
      dedupeKey: `report-deadline:${report._id}:${w.hours}`,
    });
  }
}

// Auctions about to close -> everyone who bid, plus everyone who wishlisted it.
async function remindAuctionDeadlines() {
  const auctions = await Auction.find({ status: "Active", deadline: { $gt: new Date() } }).populate(
    "item",
    "name"
  );

  for (const auction of auctions) {
    const w = windowFor(auction.deadline);
    if (!w) continue;

    const itemName = auction.item?.name || "an artifact";
    const bidderIds = await Bid.find({ auction: auction._id }).distinct("bidder");
    const wishlistUserIds = await Wishlist.find({ item: auction.item?._id }).distinct("user");

    await notifyMany([...bidderIds, ...wishlistUserIds], {
      category: "reminder",
      type: "auction.ending",
      title: `Auction ends ${w.label}`,
      message: `Bidding on "${itemName}" closes ${new Date(auction.deadline).toLocaleString()}. Current bid ${money(auction.current_bid ?? auction.starting_bid)}.`,
      link: `/auctions/${auction._id}`,
      deadlineAt: auction.deadline,
      dedupeKey: `auction-ending:${auction._id}:${w.hours}`,
    });
  }
}

// Equipment return dates -> the borrower, and the admin desk.
async function remindEquipmentReturns() {
  const rentals = await ToolRentalRequest.find({
    approval_status: "Approved",
    returned_at: null,
    end_date: { $gt: new Date() },
  }).populate("tool", "model_no type");

  for (const rental of rentals) {
    const w = windowFor(rental.end_date);
    if (!w) continue;

    const toolName = rental.tool ? `${rental.tool.type} (${rental.tool.model_no})` : "borrowed equipment";

    await notify({
      user: rental.user,
      category: "reminder",
      type: "tool.return.due",
      title: `Equipment due back ${w.label}`,
      message: `${toolName} is due for return on ${new Date(rental.end_date).toLocaleDateString()}.`,
      link: "/equipment",
      actionRequired: true,
      deadlineAt: rental.end_date,
      dedupeKey: `tool-return:${rental._id}:${w.hours}`,
    });
  }

  // Anything already overdue stays on the admin's radar, once only.
  const overdue = await ToolRentalRequest.find({
    approval_status: "Approved",
    returned_at: null,
    end_date: { $lt: new Date() },
  }).populate("tool", "model_no type");

  for (const rental of overdue) {
    await notifyRole("admin", {
      category: "reminder",
      type: "tool.return.overdue",
      title: "Equipment return overdue",
      message: `${rental.tool ? `${rental.tool.type} (${rental.tool.model_no})` : "Equipment"} was due back on ${new Date(rental.end_date).toLocaleDateString()} and has not been returned.`,
      link: "/admin/tool-inventory",
      dashboardKey: "tool_inventory",
      actionRequired: true,
      deadlineAt: rental.end_date,
      dedupeKey: `tool-overdue:${rental._id}`,
    });
  }
}

// Artifact loan end dates -> both museums.
async function remindArtifactLoans() {
  const loans = await ArtifactLoan.find({
    status: "Approved",
    returned_at: null,
    end_date: { $gt: new Date() },
  }).populate("item", "name");

  for (const loan of loans) {
    const w = windowFor(loan.end_date);
    if (!w) continue;

    const itemName = loan.item?.name || "the borrowed artifact";
    await notifyMany([loan.requesting_museum, loan.lending_museum], {
      category: "reminder",
      type: "loan.return.due",
      title: `Artifact loan ends ${w.label}`,
      message: `The loan of "${itemName}" ends ${new Date(loan.end_date).toLocaleDateString()}. Arrange the return handover.`,
      link: "/mm/my-loans",
      actionRequired: true,
      deadlineAt: loan.end_date,
      dedupeKey: `loan-return:${loan._id}:${w.hours}`,
    });
  }
}

// Exhibitions about to open -> the organising museum, and nearby members.
async function remindExhibitions() {
  const exhibitions = await Exhibition.find({
    status: "published",
    start_date: { $gt: new Date() },
  });

  if (!exhibitions.length) return;

  const locatedUsers = await User.find({
    status: "approved",
    role: { $ne: "admin" },
    "roleProfile.location.lat": { $ne: null },
  }).select("_id role roleProfile.location");

  for (const ex of exhibitions) {
    const w = windowFor(ex.start_date);
    if (!w) continue;

    await notify({
      user: ex.museum_manager,
      category: "reminder",
      type: "exhibition.starting",
      title: `Your exhibition opens ${w.label}`,
      message: `"${ex.title}" opens ${new Date(ex.start_date).toLocaleDateString()}. Confirm the final arrangements.`,
      link: "/mm/exhibitions",
      deadlineAt: ex.start_date,
      dedupeKey: `exhibition-start:${ex._id}:${w.hours}`,
    });

    if (ex.location?.lat == null || ex.location?.lng == null) continue;

    const nearby = locatedUsers.filter((u) => {
      const loc = u.roleProfile?.location;
      if (loc?.lat == null || loc?.lng == null) return false;
      return haversineKm(ex.location.lat, ex.location.lng, loc.lat, loc.lng) <= NEARBY_RADIUS_KM;
    });

    await notifyMany(
      nearby.map((u) => u._id),
      {
        category: "event",
        type: "exhibition.nearby.starting",
        title: `Happening near you ${w.label}`,
        message: `"${ex.title}" at ${ex.museum_name || ex.location.address || "a venue near you"} opens ${new Date(ex.start_date).toLocaleDateString()}.`,
        link: "/exhibitions",
        deadlineAt: ex.start_date,
        dedupeKey: `exhibition-nearby:${ex._id}:${w.hours}`,
      },
      [ex.museum_manager]
    );
  }
}

// --- runner ----------------------------------------------------------------

const SWEEPS = [
  ["tender deadlines", remindTenderDeadlines],
  ["field report deadlines", remindFieldReportDeadlines],
  ["auction deadlines", remindAuctionDeadlines],
  ["equipment returns", remindEquipmentReturns],
  ["artifact loans", remindArtifactLoans],
  ["exhibitions", remindExhibitions],
];

async function runReminderSweep() {
  for (const [label, sweep] of SWEEPS) {
    try {
      await sweep();
    } catch (err) {
      // One failing sweep must not stop the others.
      console.error(`[reminders] ${label} sweep failed:`, err.message);
    }
  }
}

function startReminderScheduler() {
  // First pass shortly after boot, then on a fixed interval.
  setTimeout(runReminderSweep, 10 * 1000);
  const timer = setInterval(runReminderSweep, SWEEP_INTERVAL_MS);
  timer.unref?.();
  console.log("[reminders] deadline reminder scheduler started");
  return timer;
}

module.exports = { startReminderScheduler, runReminderSweep };
