// One row per (recipient, event). Fan-out to a role happens at write time in
// services/notify.js, so reads are always an indexed lookup on `user`.
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Buckets the notification panel groups by. Keep in sync with CATEGORY_LABELS
// in frontend/src/components/NotificationBell.jsx.
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

// Categories delivered only to certain roles, enforced in services/notify.js.
// Only the two parties on a dig rate each other, so nobody else sees "review".
const CATEGORY_ROLES = {
  review: ["archaeologist", "excavation_team"],
};

// Maps a notification to the admin dashboard card its badge counts under.
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

    // Role at send time, so filtering still reads right if the account changes.
    role: { type: String, default: "" },

    category: { type: String, enum: CATEGORIES, required: true },

    // Specific event, e.g. "auction.outbid".
    type: { type: String, required: true },

    title: { type: String, required: true },
    message: { type: String, default: "" },

    // Route the notification opens.
    link: { type: String, default: "" },

    // These sort to the top of the panel and show a marker.
    action_required: { type: Boolean, default: false },

    read: { type: Boolean, default: false },
    read_at: { type: Date, default: null },

    // On deadline reminders, so the panel can show "in 2 days".
    deadline_at: { type: Date, default: null },

    dashboard_key: { type: String, enum: [...DASHBOARD_KEYS, ""], default: "" },

    dedupe_key: { type: String, default: null },

    // Marks seeded demo rows so they can be refreshed apart from real traffic.
    demo: { type: Boolean, default: false },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, category: 1, createdAt: -1 });
// Unique + sparse: reminders build a deterministic dedupe key, and this index
// is what silently rejects the second attempt to send the same one.
notificationSchema.index({ dedupe_key: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.DASHBOARD_KEYS = DASHBOARD_KEYS;
module.exports.CATEGORY_ROLES = CATEGORY_ROLES;
