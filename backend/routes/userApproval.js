const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { notify } = require("../services/notify"); // Role-Based Notification & Reminder System

const router = express.Router();

// Only Government/Admin can access
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Only Government/Admin can perform this action.",
    });
  }
  next();
}

// Get all pending users
router.get(
  "/pending-users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const users = await User.find({
        status: "pending",
      }).select("-password");

      res.json({ users });
    } catch (err) {
      res.status(500).json({
        error: "Failed to load pending users.",
      });
    }
  }
);

// Approve user
router.patch(
  "/users/:id/approve",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const approved = await User.findByIdAndUpdate(
        req.params.id,
        { status: "approved" },
        { new: true }
      );

      // Notification: tell the account holder they are live.
      await notify({
        user: approved?._id,
        role: approved?.role,
        category: "account",
        type: "account.approved",
        title: "Your ArchiveEarth account is approved",
        message: "The Government/Admin has approved your registration. You now have full access to your dashboard.",
        link: "/login",
      });

      res.json({
        message: "User approved successfully.",
      });
    } catch (err) {
      res.status(500).json({
        error: "Approval failed.",
      });
    }
  }
);

// Reject user
router.patch(
  "/users/:id/reject",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const rejected = await User.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
      );

      // Notification: tell the applicant the outcome.
      await notify({
        user: rejected?._id,
        role: rejected?.role,
        category: "account",
        type: "account.rejected",
        title: "Registration request declined",
        message: "Your ArchiveEarth registration was not approved. Contact the Government/Admin office if you believe this is a mistake.",
        link: "/login",
      });

      res.json({
        message: "User rejected.",
      });
    } catch (err) {
      res.status(500).json({
        error: "Reject failed.",
      });
    }
  }
);

module.exports = router;