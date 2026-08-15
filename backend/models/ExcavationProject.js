const mongoose = require("mongoose");
const { Schema } = mongoose;

const excavationProjectSchema = new Schema(
  {
    p_name: { type: String, required: true, unique: true },
    organization: String,
    start_date: Date,
    end_date: { type: Date, default: null },
    progress: String,
    lead_archaeologist: { type: Schema.Types.ObjectId, ref: "User" },
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    budget: Number,

    // ------------------------------------------------------------------
    // Ahad_23201016 - Tender Publication & Bidding
    // Every field below is optional so projects created by the older
    // "Excavation Requests" flow keep working exactly as they did before.
    // ------------------------------------------------------------------

    // The winning excavation team (a User with role "excavation_team")
    excavation_team: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // Where the project came from
    tender: { type: Schema.Types.ObjectId, ref: "Tender", default: null },
    discoveryReport: { type: Schema.Types.ObjectId, ref: "DiscoveryReport", default: null },

    // Copied from the discovery report so "Add Artifact" can pin every find to
    // the exact spot the artifact was originally reported from.
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: "" },
    },

    agreed_timeline_days: { type: Number, default: null },

    // Artifacts recovered during this dig, awaiting the admin's allocation
    artifacts: [{ type: Schema.Types.ObjectId, ref: "Item" }],

    // Set when the dig is finished and handed over to the Government/Admin
    submitted_to_admin: { type: Boolean, default: false },
    completed_at: { type: Date, default: null },
    completion_notes: { type: String, default: "" },
    allocation_done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExcavationProject", excavationProjectSchema);
