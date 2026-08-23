const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    nid: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: [
        "public",
        "archaeologist",
        "museum_manager",
        "excavation_team", // Ahad_23201016 - was "site_caretaker"
        "admin",
        "manager"
      ],
      default: "public",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true }, // bcrypt hash
    profile_pic: { type: String, default: null },

    // role-specific fields (only the relevant ones get populated per role)
    roleProfile: {
      // Archaeologist / Researcher
      affiliation: String,
      specialization: String,

      location: {
        lat: Number,
        lng: Number,
      },

      // Government/Admin
      administration: String,

      // Museum Authority
      museum_name: String,
      designation: String,
      address: String,
      operating_hours: String,
      ticket_info: String,

      // Excavation Team
      // Ahad_23201016 - an excavation team account represents a company, and
      // `name` on the user itself is that company's representative.
      company_name: String,
      representative_designation: String,
      team_size: Number,
      organization: String,
      team_leader: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
