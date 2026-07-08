const mongoose = require("mongoose");
const { Schema } = mongoose;

const siteSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    era: String,
    s_thana: String,
    s_district: String,
    s_street: String,
    description: String,
    architecture: String,
    pictures: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Site", siteSchema);
