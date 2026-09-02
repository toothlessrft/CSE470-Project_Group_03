const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  A request to take excavation tools / field equipment out to a dig.

  Raised by the lead archaeologist or the assigned excavation team of an active
  project, approved by the Government/Admin, and closed out when the kit comes
  back. `project` doubles as the "active zone" the equipment is assigned to.
*/
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

    // ---- Inventory Tracking -------------------------------------------
    // How many units of this tool are being taken out. Defaults to 1 so rows
    // created before this field existed still count correctly.
    quantity: { type: Number, default: 1, min: 1 },

    // Set when the kit is checked back in; until then the units count as out
    // on assignment and are subtracted from availability.
    returned_at: { type: Date, default: null },
    return_notes: { type: String, default: "" },

    // Free-text note from the admin when approving or denying.
    decision_note: { type: String, default: "" },
    decided_at: { type: Date, default: null },
  },
  { timestamps: true }
);

// A team may need the same tool on two different digs, and may re-borrow a
// tool it has already returned, so (user, tool) deliberately is NOT unique.
// Duplicate *open* requests are rejected in routes/inventory.js instead.
toolRentalRequestSchema.index({ user: 1, tool: 1, project: 1 });
toolRentalRequestSchema.index({ approval_status: 1, returned_at: 1 });

module.exports = mongoose.model("ToolRentalRequest", toolRentalRequestSchema);
