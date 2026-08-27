// Cross Feedback & Performance Review System - the "review" notification
// category.
//
// Only two roles ever take part in a dig: the lead archaeologist and the
// excavation team awarded the tender. When a project finishes, each one is
// asked to rate the other, so exactly two notifications exist per completed
// project and nobody else can receive one (the allow list is enforced
// centrally by CATEGORY_ROLES in models/Notification.js).
//
// Two entry points:
//
//   sendReviewRequests(project)          - called the moment a project is
//                                          marked finished, from either
//                                          completion route.
//   ensureReviewRequestNotifications(u)  - self-healing backfill, called on
//                                          every notification fetch rather
//                                          than only at server boot, so it
//                                          takes effect on the next page
//                                          load/poll instead of depending on
//                                          the backend actually being
//                                          restarted (a browser refresh does
//                                          not do that).
//
// The backfill matters because notify() swallows its own errors by design: a
// failed send leaves no trace, and a completed project has no UI anywhere to
// retrigger the prompt from. Both entry points are idempotent - a party who
// already has the notification, or who has already left their review, is
// skipped.
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

// Has this person already been asked, or already answered, for this project?
async function alreadyHandled(userId, project) {
  const [hasNotification, hasReview] = await Promise.all([
    Notification.exists({ user: userId, type: "review.requested", "meta.project": project._id }),
    Review.exists({ project: project._id, reviewer: userId }),
  ]);
  if (hasNotification || hasReview) return true;

  // Also covers a notification sent before "meta.project" was tracked,
  // without needing a separate migration to backfill that field.
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

// One prompt for one person. `role` is passed explicitly so notify() does not
// have to re-read the user just to check the category allow list.
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
    // "Go to page" opens the recipient's own view of the project, where the
    // "Rate your partner" button next to the other party sits. The two roles
    // reach the same ProjectDetail page by different routes.
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

/**
 * Ask both sides of a finished project to review each other.
 *
 * Called from every route that ends a project. The person who clicked
 * "Complete" is deliberately NOT excluded here: they see the rating popup
 * inline straight away, but if they dismiss it with "Maybe later" the
 * notification is the only way back to it.
 *
 * @returns the number of prompts actually created (0-2).
 */
async function sendReviewRequests(project) {
  try {
    if (!project?._id || !project.end_date) return 0;

    const leadId = idOf(project.lead_archaeologist);
    const teamId = idOf(project.excavation_team);
    // A review needs two sides - a project with only one party recorded has
    // nobody to rate.
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

// Accounts already checked in this process. A newly completed project is
// still caught immediately because the completion routes call
// sendReviewRequests() themselves - this is only a safety net for prompts
// that never arrived, so a per-process cache is enough.
const checked = new Set();

async function ensureReviewRequestNotifications(user) {
  try {
    if (!user?._id) return;
    // Only the two roles that take part in a dig can be owed a prompt.
    if (user.role !== "archaeologist" && user.role !== "excavation_team") return;

    const userId = String(user._id);
    if (checked.has(userId)) return;
    checked.add(userId);

    // Finished projects this user was part of, on whichever side they sat.
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
