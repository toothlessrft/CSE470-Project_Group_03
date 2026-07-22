const mongoose = require("mongoose");
const { Schema } = mongoose;

// Exhibition Management (Museum Authority):
// Schedule and manage Exhibitions, Educational tours, and Cultural events,
// then publish the details so the public can discover them ("Near Me" and
// other pages).
const exhibitionSchema = new Schema(
  {
    museum_manager: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Denormalized so public pages don't need to populate/join for a simple listing.
    museum_name: { type: String, trim: true },

    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["exhibition", "educational_tour", "cultural_event"],
      default: "exhibition",
    },
    description: { type: String, trim: true },
    image: { type: String, default: null },

    site: { type: Schema.Types.ObjectId, ref: "Site", default: null },

    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: "" },
    },

    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    start_time: { type: String, default: "" }, // e.g. "10:00 AM"
    end_time: { type: String, default: "" },

    capacity: { type: Number, default: null },
    ticket_info: { type: String, default: "" }, // e.g. "Free entry" / "BDT 50"
    contact: { type: String, default: "" },

    status: {
      type: String,
      enum: ["draft", "published", "cancelled"],
      default: "draft",
    },
  },
  { timestamps: true }
);

exhibitionSchema.index({ status: 1, start_date: 1 });
exhibitionSchema.index({ "location.lat": 1, "location.lng": 1 });

module.exports = mongoose.model("Exhibition", exhibitionSchema);