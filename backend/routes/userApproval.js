const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

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
      await User.findByIdAndUpdate(req.params.id, {
        status: "approved",
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
      await User.findByIdAndUpdate(req.params.id, {
        status: "rejected",
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