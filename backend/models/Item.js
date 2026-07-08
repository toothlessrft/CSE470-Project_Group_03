const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  Original schema had Items + four specialization tables
  (Pottery/Pottery_2, Metal_Object/Metal_Object_2, Paintings, Human_Remains)
  joined 1-to-1 on item_id. Mongo doesn't need that split, so we embed a single
  `specialization` sub-document whose shape depends on `type`.
*/

const specializationSchema = new Schema(
  {
    // Pottery
    utility_pottery: String,
    material_type: String,
    // Metal_Object
    utility_metal: String,
    alloy: String,
    // Paintings
    painter: String,
    canvas_material: String,
    paint_type: String,
    // Human_Remains
    cause_of_death: String,
    gender: String,
    ethnicity: String,
    age: Number,
    decay_percentage: Number,
    ornaments: String,
  },
  { _id: false }
);

const itemSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    name: { type: String, required: true },
    picture: String,
    description: String,
    discovery_date: Date,
    location: { type: String, default: "Govt. repository" },
    A_flag: { type: String, enum: ["yes", "no"], default: "yes" },
    Type: {
      type: String,
      enum: ["Pottery", "Metal_Object", "Paintings", "Human_Remains", "other"],
      default: "other",
    },
    specialization: specializationSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
