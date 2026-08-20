// Role-Based Notification & Reminder System - write side.
//
// Every route that wants to raise a notification goes through here rather than
// touching the model directly. Two rules are enforced centrally:
//
//   1. Sending never throws. A notification failing is not a reason for the
//      user's actual action (placing a bid, approving a report) to 500, so
//      every helper swallows and logs its own errors.
//   2. Nobody is notified about their own action - `exclude` drops the actor.
const Notification = require("../models/Notification");
const User = require("../models/User");

function idOf(value) {
  if (!value) return null;
  return String(value._id || value);
}

/*
  dedupe_key is uniquely indexed, so a fan-out that reuses one key would only
  ever reach the first recipient - everyone else would be rejected as a
  duplicate. Scoping the key per user keeps the "send this reminder once per
  person" guarantee that callers actually want.
*/
function scopedPayload(payload, userId) {
  if (!payload.dedupeKey) return { ...payload, user: userId };
  return { ...payload, user: userId, dedupeKey: `${payload.dedupeKey}:${userId}` };
}

/**
 * Send one notification.
 * @returns the created document, or null if it was skipped/deduped/failed.
 */
async function notify({
  user,
  category,
  type,
  title,
  message = "",
  link = "",
  actionRequired = false,
  deadlineAt = null,
  dashboardKey = "",
  dedupeKey = null,
  role = "",
  meta = {},
}) {
  try {
    const userId = idOf(user);
    if (!userId || !category || !type || !title) return null;

    let resolvedRole = role;
    if (!resolvedRole) {
      resolvedRole = user?.role || (await User.findById(userId).select("role"))?.role || "";
    }

    return await Notification.create({
      user: userId,
      role: resolvedRole,
      category,
      type,
      title,
      message,
      link,
      action_required: actionRequired,
      deadline_at: deadlineAt,
      dashboard_key: dashboardKey,
      dedupe_key: dedupeKey,
      meta,
    });
  } catch (err) {
    // 11000 = duplicate dedupe_key, which is the reminder sweeper working as
    // intended rather than an error worth logging.
    if (err?.code !== 11000) {
      console.error("[notify] could not create notification:", err.message);
    }
    return null;
  }
}

/**
 * Send the same notification to several users, skipping duplicates and anyone
 * listed in `exclude` (normally the person who triggered the event).
 */
async function notifyMany(users, payload = {}, exclude = []) {
  const excluded = new Set(exclude.map(idOf).filter(Boolean));
  const seen = new Set();

  const targets = (users || [])
    .map(idOf)
    .filter((id) => id && !excluded.has(id) && !seen.has(id) && seen.add(id));

  const results = await Promise.all(targets.map((id) => notify(scopedPayload(payload, id))));
  return results.filter(Boolean);
}

/** Send to every approved account holding one of the given roles. */
async function notifyRole(roles, payload = {}, exclude = []) {
  try {
    const roleList = Array.isArray(roles) ? roles : [roles];
    const users = await User.find({
      role: { $in: roleList },
      // Admins are exempt from the approval gate everywhere else in the app.
      $or: [{ status: "approved" }, { role: "admin" }],
    }).select("_id role");

    const excluded = new Set(exclude.map(idOf).filter(Boolean));
    const results = await Promise.all(
      users
        .filter((u) => !excluded.has(String(u._id)))
        .map((u) => notify({ ...scopedPayload(payload, u._id), role: u.role }))
    );
    return results.filter(Boolean);
  } catch (err) {
    console.error("[notify] could not fan out to role:", err.message);
    return [];
  }
}

/** Shorthand for the Government/Admin inbox, which drives the dashboard badges. */
async function notifyAdmins(payload = {}, exclude = []) {
  return notifyRole("admin", payload, exclude);
}

module.exports = { notify, notifyMany, notifyRole, notifyAdmins };
