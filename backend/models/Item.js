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

    // Smart Artifact Search Engine - searchable tags, optional so existing
    // AddItem flow keeps working even if these are left blank.
    civilization: { type: String, trim: true },
    era: { type: String, trim: true },
    region: { type: String, trim: true },
    material: { type: String, trim: true },
    usage: { type: String, trim: true },

    // Report Approval & Artifact Allocation: where the admin decided a newly
    // discovered artifact should go. Defaults to Unallocated for every other
    // existing/legacy item, so nothing already in the catalogue is affected.
    allocation: {
      type: String,
      enum: ["Unallocated", "Museum", "Auction"],
      default: "Unallocated",
    },
    museumName: { type: String, trim: true, default: "" },

    // Museum Collection & Artifact Inventory Management (Feature 12) ---------
    // Human-readable unique ID shown to visitors/curators, separate from the
    // internal Mongo _id. Auto-generated on first save if not provided.
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
    // Free-text ownership record (e.g. "Government of Bangladesh",
    // "On loan from National Museum").
    ownership: { type: String, trim: true, default: "Government of Bangladesh" },

    // Full movement/status history — appended to automatically whenever the
    // artifact is moved, its status changes, it's loaned, returned, or
    // allocated/transferred.
    movementHistory: { type: [movementEntrySchema], default: [] },

    // true only for artifacts a museum manager added directly through their
    // own inventory tools (not ones that came via the Admin allocation
    // pipeline) — controls whether DELETE actually removes the record.
    addedByManager: { type: Boolean, default: false },

    // Ahad_23201016 - Tender Publication & Bidding.
    // Artifacts recovered during an active excavation project stay hidden from
    // Smart Artifact Search until the Government/Admin allocates them. Defaults
    // to false so every artifact already in the catalogue is unaffected.
    pending_allocation: { type: Boolean, default: false },
    excavationProject: { type: Schema.Types.ObjectId, ref: "ExcavationProject", default: null },
  },
  { timestamps: true }
);

// Auto-generate a short, human-readable unique ID the first time an artifact is saved.
itemSchema.pre("save", function (next) {
  if (!this.artifactId) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.artifactId = `AE-${stamp}-${rand}`;
  }
  next();
});

module.exports = mongoose.model("Item", itemSchema);