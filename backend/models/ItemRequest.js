const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemRequestSchema = new Schema(
  {
    museum_manager: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    purpose: { type: String, required: true },
    approval_status: {
      type: String,
      enum: ["Pending", "Approved", "Denied"],
      default: "Pending",
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    insurance_info: { type: String, required: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: "request_date", updatedAt: true } }
);

module.exports = mongoose.model("ItemRequest", itemRequestSchema);
