const mongoose = require("mongoose");
const { Schema } = mongoose;

const toolSchema = new Schema(
  {
    model_no: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    owner: { type: String, required: true },
    insurance_info: String,
    hazard: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tool", toolSchema);
