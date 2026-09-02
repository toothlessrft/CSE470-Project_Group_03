// Cross feedback: when a dig ends, the lead archaeologist and the excavation
// team are each asked to rate the other, so two prompts per finished project.
// sendReviewRequests() fires on completion; ensureReviewRequestNotifications()
// is a backfill for prompts that never arrived. Both are idempotent.
const Notification = require("../models/Notification");
const ExcavationProject = require("../models/ExcavationProject");
const Review = require("../models/Review");
const { notify } = require("./notify");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function idOf(value) {
  if (!value) return null;
  return String(value._id || value);
}

// Already asked, or already answered?
async function alreadyHandled(userId, project) {
  const [hasNotification, hasReview] = await Promise.all([
    Notification.exists({ user: userId, type: "review.requested", "meta.project": project._id }),
    Review.exists({ project: project._id, reviewer: userId }),
  ]);
  if (hasNotification || hasReview) return true;

  // Older notifications predate meta.project, so match on the project name.
  if (project.p_name) {
    const legacyMatch = await Notification.exists({
      user: userId,
      type: "review.requested",
      message: { $regex: escapeRegex(project.p_name) },
    });
    if (legacyMatch) return true;
  }
  return false;
}

// One prompt for one person. role is passed in so notify() need not re-read
// the user to check the category allow list.
async function requestReviewFrom(userId, role, project) {
  if (!userId) return null;
  if (await alreadyHandled(userId, project)) return null;

  const sent = await notify({
    user: userId,
    role,
    category: "review",
    type: "review.requested",
    title: "Report submitted, rate your partner",
    message: `The excavation "${project.p_name}" is complete. Share a rating and feedback about your partner.`,
    // Both roles land on the same project page, by different routes.
    link:
      role === "excavation_team"
        ? `/et/projects/${project._id}`
        : `/arc/projects/${project._id}`,
    actionRequired: true,
    meta: { project: project._id },
  });

  if (!sent) {
    console.error(
      `[reviews] could not ask ${userId} to rate project ${project._id} - check the "review" category and its role allow list in models/Notification.js.`
    );
  }
  return sent;
}

// Ask both sides of a finished project to rate each other. Returns how many
// prompts were created (0-2). Whoever clicked "Complete" still gets one, since
// dismissing the inline popup would otherwise lose it.
async function sendReviewRequests(project) {
  try {
    if (!project?._id || !project.end_date) return 0;

    const leadId = idOf(project.lead_archaeologist);
    const teamId = idOf(project.excavation_team);
    // Needs both sides recorded.
    if (!leadId || !teamId) return 0;

    const results = await Promise.all([
      requestReviewFrom(leadId, "archaeologist", project),
      requestReviewFrom(teamId, "excavation_team", project),
    ]);
    return results.filter(Boolean).length;
  } catch (err) {
    console.error("[reviews] could not send review requests:", err.message);
    return 0;
  }
}

// Accounts already backfilled in this process - just a safety net, so an
// in-memory set is enough.
const checked = new Set();

async function ensureReviewRequestNotifications(user) {
  try {
    if (!user?._id) return;
    // Only these two roles take part in a dig.
    if (user.role !== "archaeologist" && user.role !== "excavation_team") return;

    const userId = String(user._id);
    if (checked.has(userId)) return;
    checked.add(userId);

    // Finished projects this user was on, either side.
    const sideFilter =
      user.role === "archaeologist"
        ? { lead_archaeologist: user._id, excavation_team: { $ne: null } }
        : { excavation_team: user._id, lead_archaeologist: { $ne: null } };

    const completedProjects = await ExcavationProject.find({
      ...sideFilter,
      end_date: { $ne: null },
    }).select("p_name");

    for (const project of completedProjects) {
      await requestReviewFrom(user._id, user.role, project);
    }
  } catch (err) {
    console.error("[review-notifications] could not backfill:", err.message);
  }
}

module.exports = { sendReviewRequests, ensureReviewRequestNotifications };
