// Write side of the notification system. Every route raises notifications
// through here instead of touching the model, which centralises three rules:
// sending never throws (a failed notification must not 500 the user's actual
// action), the actor is dropped via `exclude`, and role-restricted categories
// are filtered against CATEGORY_ROLES.
const Notification = require("../models/Notification");
const { CATEGORY_ROLES } = require("../models/Notification");
const User = require("../models/User");

function idOf(value) {
  if (!value) return null;
  return String(value._id || value);
}

// dedupe_key is uniquely indexed, so a fan-out reusing one key would only
// reach the first recipient. Scoping it per user gives "once per person".
function scopedPayload(payload, userId) {
  if (!payload.dedupeKey) return { ...payload, user: userId };
  return { ...payload, user: userId, dedupeKey: `${payload.dedupeKey}:${userId}` };
}

// Send one notification. Returns the document, or null if skipped or deduped.
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

    // Role gate for restricted categories, checked once here instead of at
    // every call site.
    const allowedRoles = CATEGORY_ROLES[category];
    if (allowedRoles && !allowedRoles.includes(resolvedRole)) {
      console.warn(
        `[notify] skipped "${category}" notification for role "${resolvedRole || "unknown"}" - restricted to ${allowedRoles.join(", ")}.`
      );
      return null;
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
    // 11000 = duplicate dedupe_key: the reminder sweeper working as intended.
    if (err?.code !== 11000) {
      console.error("[notify] could not create notification:", err.message);
    }
    return null;
  }
}

// Same notification to several users, skipping duplicates and the actor.
async function notifyMany(users, payload = {}, exclude = []) {
  const excluded = new Set(exclude.map(idOf).filter(Boolean));
  const seen = new Set();

  const targets = (users || [])
    .map(idOf)
    .filter((id) => id && !excluded.has(id) && !seen.has(id) && seen.add(id));

  const results = await Promise.all(targets.map((id) => notify(scopedPayload(payload, id))));
  return results.filter(Boolean);
}

// Fan out to every approved account holding one of the given roles.
async function notifyRole(roles, payload = {}, exclude = []) {
  try {
    const roleList = Array.isArray(roles) ? roles : [roles];
    const users = await User.find({
      role: { $in: roleList },
      // Admins skip the approval gate, as everywhere else.
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

// Admin inbox - this is what drives the red badges on the admin dashboard.
async function notifyAdmins(payload = {}, exclude = []) {
  return notifyRole("admin", payload, exclude);
}

module.exports = { notify, notifyMany, notifyRole, notifyAdmins };
