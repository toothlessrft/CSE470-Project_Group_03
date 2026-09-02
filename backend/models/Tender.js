// Ahad_23201016 - Tender Publication & Management (Government)
const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  Ahad_23201016
  An excavation tender published by the Government/Admin once an archaeologist
  has verified a discovery, submitted the field report, and asked for an
  excavation team.

  Lifecycle:
    Open      -> excavation teams can browse it and submit/edit/withdraw bids
    Awarded   -> a winning bid was accepted; an ExcavationProject now exists
    Cancelled -> the admin pulled the tender before awarding it
*/
const tenderSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },

    // Where this tender came from. Both are optional so an admin can also
    // publish a standalone tender that isn't tied to a public discovery.
    discoveryReport: { type: Schema.Types.ObjectId, ref: "DiscoveryReport", default: null },
    fieldReport: { type: Schema.Types.ObjectId, ref: "ResearcherReport", default: null },

    // The archaeologist who verified the site - becomes the lead on the project
    archaeologist: { type: Schema.Types.ObjectId, ref: "User", default: null },

    project_details: { type: String, required: true },
    requirements: { type: String, default: "" },

    // Auto-filled from the discovery report so the dig happens exactly where
    // the artifact was reported.
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: "" },
    },

    deadline: { type: Date, required: true },
    estimated_budget: { type: Number, required: true, min: 0 },

    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["Open", "Awarded", "Cancelled"],
      default: "Open",
    },

    // Filled in once a winning bid is accepted
    awarded_bid: { type: Schema.Types.ObjectId, ref: "TenderBid", default: null },
    awarded_team: { type: Schema.Types.ObjectId, ref: "User", default: null },
    awarded_at: { type: Date, default: null },
    project: { type: Schema.Types.ObjectId, ref: "ExcavationProject", default: null },

    cancel_reason: { type: String, default: "" },
  },
  { timestamps: true }
);

tenderSchema.index({ status: 1, deadline: 1 });

module.exports = mongoose.model("Tender", tenderSchema);
