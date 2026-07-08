const mongoose = require("mongoose");
const { Schema } = mongoose;

const requestMaintenanceSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    caretaker: { type: Schema.Types.ObjectId, ref: "User" },
    damage: { type: String, required: true },
    approved_budget: { type: Number, default: null },
    repair_cost: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    admin: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: "request_date", updatedAt: true } }
);

module.exports = mongoose.model("RequestMaintenance", requestMaintenanceSchema);
