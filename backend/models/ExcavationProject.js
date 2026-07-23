const mongoose = require("mongoose");
const { Schema } = mongoose;

const excavationProjectSchema = new Schema(
  {
    p_name: { type: String, required: true, unique: true },
    organization: String,
    start_date: Date,
    end_date: { type: Date, default: null },
    progress: String,
    lead_archaeologist: { type: Schema.Types.ObjectId, ref: "User" },
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    budget: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExcavationProject", excavationProjectSchema);
