// One-time, idempotent startup fixes for data shaped by an older version of
// the code. Safe to run on every boot - each one only touches rows that
// still need it, so a second run is always a no-op.
//
// (The "review.requested" notification never having been created at all is
// handled separately in services/reviewNotifications.js, checked on every
// notification fetch rather than only here - a fix that only runs at boot
// depends on the backend process actually being restarted, which a plain
// browser refresh does not do.)
const Notification = require("../models/Notification");

// "Report submitted, rate your partner" notifications always link to the
// dedicated /reviews/:projectId review page. An earlier version briefly
// pointed these at the recipient's own project page instead
// (/et/projects/:id?review=1 or /arc/projects/:id?review=1); any
// notification created under that code is stuck with the old link forever -
// the project is already complete, so the recipient has no way to
// regenerate it - unless it's rewritten here. Also backfills the "review"
// category on any older row that predates that category existing (it was
// filed under "assignment" as a fallback).
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

async function runStartupMigrations() {
  try {
    await fixReviewRequestNotifications();
  } catch (err) {
    console.error("[migrations] failed:", err.message);
  }
}

module.exports = { runStartupMigrations };
