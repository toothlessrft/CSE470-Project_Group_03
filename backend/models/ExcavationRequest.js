const mongoose = require("mongoose");
const { Schema } = mongoose;

const excavationRequestSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    archaeologist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    proposal: { type: String, required: true },
    budget: Number,
  },
  { timestamps: true }
);

// mirrors the composite primary key (site_id, archeologist) in the original schema
excavationRequestSchema.index({ site: 1, archaeologist: 1 }, { unique: true });

module.exports = mongoose.model("ExcavationRequest", excavationRequestSchema);
