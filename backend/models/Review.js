const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  Cross Feedback & Performance Review System.

  Each completed ExcavationProject pairs exactly one archaeologist (lead) with
  one excavation team. Once the project is marked complete, either side can
  leave the other exactly one review - the unique index on (project, reviewer)
  is what enforces "one review per person per project", and reviews are never
  edited afterwards, so the history stays an honest record.
*/
const reviewSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "ExcavationProject", required: true },

    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Role of the person leaving this review (not the recipient).
    reviewer_role: { type: String, enum: ["archaeologist", "excavation_team"], required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

reviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
