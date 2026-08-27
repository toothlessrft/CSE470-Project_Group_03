// Role-Based Notification & Reminder System
const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  One row per (recipient, event). Notifications are always addressed to a single
  user - fan-out to a role happens at write time in services/notify.js, so a
  read is always a simple indexed lookup on `user`.

  `dedupe_key` is what keeps the reminder sweeper honest: every automatic
  reminder builds a deterministic key (e.g. "tender-deadline:<id>:24h") and the
  unique sparse index below silently rejects the second attempt to insert it.
*/

// The buckets the notification panel groups by. Keep these in sync with
// CATEGORY_LABELS in frontend/src/components/NotificationBell.jsx.
const CATEGORIES = [
  "auction", // outbid, highest bidder, wishlist listed, won/lost, cancelled
  "event", // exhibitions / educational tours / cultural events near the user
  "report", // discovery + researcher report acceptance / rejection / revision
  "request", // tool, item, loan, budget, excavation and closure requests
  "assignment", // field inspections, project assignments, artifact transfers
  "tender", // tender published, bid submitted / accepted / rejected
  "review", // cross feedback & performance reviews between archaeologists and excavation teams
  "reminder", // automatic deadline reminders
  "account", // registration approval, role changes, system messages
  "qna", // Public Archaeology Q&A - new question, new answer, new comment
];

// Categories that are only ever delivered to a fixed set of roles. Enforced
// centrally in services/notify.js, so a stray caller cannot leak one of these
// into an inbox it does not belong in, and mirrored on the frontend in
// NotificationBell.jsx so the category row is hidden even if a row somehow
// predates this rule.
//
// "review" is the Cross Feedback & Performance Review bucket: only the lead
// archaeologist and the excavation team on a dig ever rate each other, so no
// other role should see this category at all.
const CATEGORY_ROLES = {
  review: ["archaeologist", "excavation_team"],
};

// Government/Admin has no bell - unread counts are shown as red circles on the
// Admin Dashboard cards instead, and this is the key that maps a notification
// to the card it belongs under.
const DASHBOARD_KEYS = [
  "field_reports",
  "tenders",
  "excavation_projects",
  "item_requests",
  "tool_requests",
  "tool_inventory",
  "excavation_requests",
  "approved_requests",
  "pending_users",
  "auctions",
];

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Snapshot of the recipient's role at send time, so role-specific filtering
    // still reads correctly if the account is later promoted.
    role: { type: String, default: "" },

    category: { type: String, enum: CATEGORIES, required: true },

    // Fine-grained event name, e.g. "auction.outbid" or "tool.request.approved".
    type: { type: String, required: true },

    title: { type: String, required: true },
    message: { type: String, default: "" },

    // Frontend route this notification should open, e.g. "/auctions/123".
    link: { type: String, default: "" },

    // Action-required alerts (approvals, revisions, assignments, bids, loan
    // requests, artifact transfers) sort to the top and show a marker.
    action_required: { type: Boolean, default: false },

    read: { type: Boolean, default: false },
    read_at: { type: Date, default: null },

    // Set on deadline reminders so the panel can show "in 2 days".
    deadline_at: { type: Date, default: null },

    dashboard_key: { type: String, enum: [...DASHBOARD_KEYS, ""], default: "" },

    dedupe_key: { type: String, default: null },

    // Marks the sample notifications created by services/sampleNotifications.js
    // so they can be counted and refreshed independently of real traffic.
    demo: { type: Boolean, default: false },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, category: 1, createdAt: -1 });
// sparse: only reminder-style notifications carry a dedupe key.
notificationSchema.index({ dedupe_key: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.DASHBOARD_KEYS = DASHBOARD_KEYS;
module.exports.CATEGORY_ROLES = CATEGORY_ROLES;
