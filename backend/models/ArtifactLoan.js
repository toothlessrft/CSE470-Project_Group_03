const mongoose = require("mongoose");
const { Schema } = mongoose;

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

    // Museum Collection & Artifact Inventory Management (Feature 12):
    // the artifact's availability right before this loan was approved, so
    // returning it can automatically restore the correct prior status
    // instead of always resetting to "In Storage".
    previous_availability: { type: String, default: null },
  },
  { timestamps: { createdAt: "request_date", updatedAt: true } }
);

module.exports = mongoose.model("ArtifactLoan", artifactLoanSchema);