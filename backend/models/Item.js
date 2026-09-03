const mongoose = require("mongoose");
const crypto = require("crypto");
const { Schema } = mongoose;


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

const movementEntrySchema = new Schema(
  {
    action: { type: String, required: true }, // e.g. "Added", "Status changed", "Moved", "Loaned out", "Returned", "Allocated"
    status: String, // availability at the time of this entry, if it changed
    location: String, // location at the time of this entry, if it changed
    note: { type: String, default: "" },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
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
      enum: ["Pottery", "Metal_Object", "Paintings", "Human_Remains", "Rock", "Jewelry", "Bone/Ivory", "other"],
      default: "other",
    },
    specialization: specializationSchema,

    // Searchable tags. Optional, so the AddItem form still works if left blank.
    civilization: { type: String, trim: true },
    era: { type: String, trim: true },
    region: { type: String, trim: true },
    material: { type: String, trim: true },
    usage: { type: String, trim: true },

    // Where the admin sent a newly discovered artifact. Defaults to
    // Unallocated, so items already in the catalogue are unaffected.
    allocation: {
      type: String,
      enum: ["Unallocated", "Museum", "Auction"],
      default: "Unallocated",
    },
    museumName: { type: String, trim: true, default: "" },

    // Human-readable ID shown to visitors and curators, separate from the
    // Mongo _id. Generated on first save if not supplied.
    artifactId: { type: String, unique: true, sparse: true },

    availability: {
      type: String,
      enum: ["On Display", "In Storage", "Under Conservation", "On Loan", "Transferred"],
      default: "In Storage",
    },
    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor"],
      default: "Good",
    },
    // Free-text ownership, e.g. "On loan from National Museum".
    ownership: { type: String, trim: true, default: "Government of Bangladesh" },

    // Movement history, appended whenever the artifact moves, changes status,
    // or is loaned, returned or allocated.
    movementHistory: { type: [movementEntrySchema], default: [] },

    // True only for artifacts a manager added through their own inventory
    // tools. Decides whether DELETE really removes the record.
    addedByManager: { type: Boolean, default: false },

    // Ahad_23201016 - finds from an active dig stay out of public search until
    // the admin allocates them. Defaults false, so existing items are unaffected.
    pending_allocation: { type: Boolean, default: false },
    excavationProject: { type: Schema.Types.ObjectId, ref: "ExcavationProject", default: null },
  },
  { timestamps: true }
);

// Generate the readable artifact ID on first save.
itemSchema.pre("save", function (next) {
  if (!this.artifactId) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.artifactId = `AE-${stamp}-${rand}`;
  }
  next();
});

module.exports = mongoose.model("Item", itemSchema);