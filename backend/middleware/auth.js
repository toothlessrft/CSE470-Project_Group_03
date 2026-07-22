const jwt = require("jsonwebtoken");
const User = require("../models/User");
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated. Please log in." });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }
    if (user.role !== "admin" && user.status !== "approved") {
      return res.status(403).json({
        error:
          user.status === "rejected"
            ? "Your registration request has been rejected."
            : "Your account is waiting for Government/Admin approval.",
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized for this action.", code: "UNAUTHORIZED" });
    }
    next();
  };
}

async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (user) req.user = user;
  } catch (err) {
    // ignore errors, just treat as not logged in
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };