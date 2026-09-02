// Idempotent startup fixes for rows written by older versions of the code.
// Each one only touches rows that still need it, so re-running is a no-op.
const Notification = require("../models/Notification");
const Item = require("../models/Item");

// Review prompts once pointed at /et|arc/projects/:id instead of /reviews/:id.
// The project is already finished, so the link can't be regenerated - repoint
// it here, and file the row under "review" if it predates that category.
async function fixReviewRequestNotifications() {
  const stray = await Notification.find({
    type: "review.requested",
    $or: [{ link: { $regex: /^\/(et|arc)\/projects\// } }, { category: { $ne: "review" } }],
  });

  let fixed = 0;
  for (const n of stray) {
    const match = n.link.match(/^\/(?:et|arc)\/projects\/([^/?]+)/);
    if (match) n.link = `/reviews/${match[1]}`;
    n.category = "review";
    await n.save();
    fixed += 1;
  }
  if (fixed) console.log(`[migrations] fixed ${fixed} review.requested notification(s).`);
}

// The auction location label used to read "Scheduled for Auction", which
// showed on the catalogue card as "Held at Scheduled for Auction". Relabel
// old rows so they read "Held at Auction" like new ones.
async function renameAuctionLocation() {
  const OLD = "Scheduled for Auction";
  const items = await Item.updateMany({ location: OLD }, { $set: { location: "Auction" } });
  const history = await Item.updateMany(
    { "movementHistory.location": OLD },
    { $set: { "movementHistory.$[entry].location": "Auction" } },
    { arrayFilters: [{ "entry.location": OLD }] }
  );
  const changed = (items.modifiedCount || 0) + (history.modifiedCount || 0);
  if (changed) console.log(`[migrations] relabelled ${changed} auction location(s).`);
}

async function runStartupMigrations() {
  try {
    await fixReviewRequestNotifications();
    await renameAuctionLocation();
  } catch (err) {
    console.error("[migrations] failed:", err.message);
  }
}

module.exports = { runStartupMigrations };
