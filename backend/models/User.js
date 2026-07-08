const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  In the original MySQL schema, each role (archaeologist, admin, museum_manager,
  site_caretaker) lived in its own table joined to `users` on `nid`.
  In MongoDB we collapse that into one `User` document with a `roleProfile`
  sub-object holding whichever fields are relevant to that user's role.
  `nid` is kept as the human-readable ID (matches the original login field),
  while Mongo's own `_id` (ObjectId) is used for all internal references.
*/

const userSchema = new Schema(
  {
    nid: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["archaeologist", "admin", "museum_manager", "site_caretaker", "manager", "other"],
      default: "other",
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true }, // bcrypt hash
    profile_pic: { type: String, default: null },

    // role-specific fields (only the relevant ones get populated per role)
    roleProfile: {
      // archaeologist
      affiliation: String,
      biography: String,
      // optional base location, used to suggest nearby researchers when
      // Government/Admin assigns a field inspection (see DiscoveryReport)
      location: {
        lat: Number,
        lng: Number,
      },
      // admin
      administration: String,
      // museum_manager
      museum_name: String,
      m_city: String,
      m_street: String,
      // site_caretaker
      site: { type: Schema.Types.ObjectId, ref: "Site" },
      budget: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
