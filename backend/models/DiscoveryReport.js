const mongoose = require("mongoose");
const { Schema } = mongoose;


const discoveryReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: "" }, 
    },

    material: { type: String, required: true, trim: true },
    images: [String], 
    notes: { type: String, default: "" },

    contact_email: { type: String, required: true, trim: true },
    contact_phone: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["Pending", "Assigned", "Verified", "Rejected"],
      default: "Pending",
    },

    // Filled in by Government/Admin during field inspection assignment
    assignment: {
      researcher: { type: Schema.Types.ObjectId, ref: "User", default: null },
      budget: Number,
      notes: { type: String, default: "" },
      due_date: Date,
      assigned_by: { type: Schema.Types.ObjectId, ref: "User" },
      assigned_at: Date,
    },

    // Filled in by the assigned researcher after the field visit
    verification: {
      result: { type: String, enum: ["true", "false", null], default: null },
      notes: { type: String, default: "" },
      submitted_at: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscoveryReport", discoveryReportSchema);
