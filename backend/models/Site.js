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

    // Smart Artifact Search Engine - lets the map view plot this site.
    // Optional: sites without coordinates simply won't have a pin.
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Site", siteSchema);
