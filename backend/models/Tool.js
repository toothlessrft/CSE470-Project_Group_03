const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  Excavation tools & field equipment.

  Inventory Tracking: `quantity_total` is how many units the store holds. The
  number still on the shelf is never written down - it is derived on read as
  quantity_total minus every approved-and-not-yet-returned rental. Keeping
  availability computed means the older admin approval screen and the new
  inventory screen can never disagree about stock levels.

  Every field added below has a default, so tools seeded by the original
  scripts/seed.js keep working untouched.
*/

const CATEGORIES = [
  "Hand Tool",
  "Survey Equipment",
  "Imaging & Remote Sensing",
  "Excavation Machinery",
  "Power & Site Support",
  "Conservation & Storage",
  "Safety Gear",
  "Other",
];

const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Repair"];

const STATUSES = [
  "In Service", // available to request
  "Maintenance", // temporarily withdrawn
  "Retired", // permanently withdrawn
];

const toolSchema = new Schema(
  {
    model_no: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    owner: { type: String, required: true },
    insurance_info: String,
    hazard: String,

    // ---- Inventory Tracking -------------------------------------------
    category: { type: String, enum: CATEGORIES, default: "Other" },
    quantity_total: { type: Number, default: 1, min: 0 },
    condition: { type: String, enum: CONDITIONS, default: "Good" },
    status: { type: String, enum: STATUSES, default: "In Service" },

    // Where the kit lives when it is not out on a dig.
    home_location: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tool", toolSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
module.exports.STATUSES = STATUSES;
