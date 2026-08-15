// Ahad_23201016 - Tender Bidding System (Excavation Team)
const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  Ahad_23201016
  A bid submitted by an excavation team against a published tender.

  A team keeps exactly one bid per tender (enforced by the compound index
  below). Editing overwrites that bid; withdrawing marks it Withdrawn instead
  of deleting it, so the government keeps a complete audit trail.

  Status:
    Pending   -> submitted, tender still open
    Accepted  -> this team won the tender
    Rejected  -> another team won, or the admin rejected it outright
    Withdrawn -> the team pulled the bid before the deadline
*/
const tenderBidSchema = new Schema(
  {
    tender: { type: Schema.Types.ObjectId, ref: "Tender", required: true },
    team: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Snapshot of the company at bid time, so the record still reads correctly
    // even if the team later renames itself.
    company_name: { type: String, default: "" },

    cost: { type: Number, required: true, min: 0 },
    timeline_days: { type: Number, required: true, min: 1 },
    proposal: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Withdrawn"],
      default: "Pending",
    },

    // Set when the admin accepts/rejects
    reviewed_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewed_at: { type: Date, default: null },
    review_notes: { type: String, default: "" },
  },
  { timestamps: { createdAt: "submitted_at", updatedAt: true } }
);

// One bid per team per tender - editing updates it in place.
tenderBidSchema.index({ tender: 1, team: 1 }, { unique: true });
tenderBidSchema.index({ team: 1, status: 1 });

module.exports = mongoose.model("TenderBid", tenderBidSchema);
