const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  Artifact Loan & Booking (Museum Authority <-> Museum Authority)
  ------------------------------------------------------------------
  A museum_manager (the "requesting_museum") asks another museum_manager
  (the "lending_museum") to loan out an artifact for a temporary exhibition.
  The lending museum then approves or declines the request. Approved loans
  are tracked until the artifact is marked returned, which gives us loan
  duration tracking (start_date -> end_date, plus actual completion date).

  This is intentionally a separate collection from ItemRequest (which is the
  existing "museum borrows from the government repository, admin approves"
  flow) so that nothing about that feature is touched.
*/

const artifactLoanSchema = new Schema(
  {
    requesting_museum: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lending_museum: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },

    exhibition_name: { type: String, required: true, trim: true },
    purpose: { type: String, required: true },

    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Declined", "Returned"],
      default: "Pending",
    },

    response_note: { type: String, default: "" },
    decided_at: { type: Date, default: null },
    returned_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "request_date", updatedAt: true } }
);

module.exports = mongoose.model("ArtifactLoan", artifactLoanSchema);
