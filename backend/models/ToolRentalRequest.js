const mongoose = require("mongoose");
const { Schema } = mongoose;

const toolRentalRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tool: { type: Schema.Types.ObjectId, ref: "Tool", required: true },
    project: { type: Schema.Types.ObjectId, ref: "ExcavationProject" },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    approval_status: {
      type: String,
      enum: ["Pending", "Approved", "Denied"],
      default: "Pending",
    },
    purpose: { type: String, required: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

toolRentalRequestSchema.index({ user: 1, tool: 1 }, { unique: true });

module.exports = mongoose.model("ToolRentalRequest", toolRentalRequestSchema);
