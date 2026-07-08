const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Site = require("../models/Site");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 8, // 8 hours
};

function issueSession(res, user) {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
  res.cookie("token", token, COOKIE_OPTIONS);
  return {
    id: user._id,
    nid: user.nid,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// Registerable roles. "admin" is deliberately excluded from public sign-up —
// in the original system admins were seeded directly into the DB, not
// self-registered. Add it back here if your group decides otherwise.
const PUBLIC_ROLES = ["archaeologist", "museum_manager", "site_caretaker"];

// GET /api/auth/sites -> used by the registration form's site-caretaker step
// (no auth required, since the person isn't logged in yet)
router.get("/sites", async (req, res) => {
  const sites = await Site.find().select("_id name");
  res.json({ sites });
});

router.post("/register", async (req, res) => {
  try {
    const { nid, name, email, phone, password, role, roleProfile } = req.body;

    if (!nid || !name || !email || !password || !role) {
      return res.status(400).json({ error: "nid, name, email, password, and role are required." });
    }
    if (!PUBLIC_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role for self-registration." });
    }

    const existing = await User.findOne({ $or: [{ nid }, { email: email.toLowerCase() }] });
    if (existing) {
      return res.status(409).json({ error: "A user with that nid or email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Only keep the roleProfile fields relevant to the chosen role.
    let profile = {};
    if (role === "archaeologist") {
      profile = { affiliation: roleProfile?.affiliation, biography: roleProfile?.biography };
    } else if (role === "museum_manager") {
      profile = {
        museum_name: roleProfile?.museum_name,
        m_city: roleProfile?.m_city,
        m_street: roleProfile?.m_street,
      };
    } else if (role === "site_caretaker") {
      profile = { site: roleProfile?.site || undefined, budget: roleProfile?.budget };
    }

    const user = await User.create({
      nid,
      name,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      role,
      roleProfile: profile,
    });

    const sessionUser = issueSession(res, user);
    res.status(201).json({ user: sessionUser });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "A user with that nid, email, or phone already exists." });
    }
    res.status(500).json({ error: "Server error during registration." });
  }
});

// The original login accepted either email OR nid as "identifier".
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifier and password are required." });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { nid: identifier }],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionUser = issueSession(res, user);
    res.json({ user: sessionUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, (req, res) => {
  const { _id, nid, name, email, role, phone, profile_pic } = req.user;
  res.json({ user: { id: _id, nid, name, email, role, phone, profile_pic } });
});

module.exports = router;

