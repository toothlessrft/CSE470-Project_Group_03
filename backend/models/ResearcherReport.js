//Researcher Report: Ahad
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Report Approval & Artifact Allocation feature: artifacts the researcher
// lists as found on site. These are just draft entries on the report itself -
// they only become real catalogue Items once the admin approves the report.
const foundArtifactSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        Type: {
            type: String,
            enum: ["Pottery", "Metal_Object", "Paintings", "Human_Remains", "Rock", "Jewelry", "Bone/Ivory", "other"],
            default: "other",
        },
        civilization: { type: String, trim: true, default: "" },
        era: { type: String, trim: true, default: "" },
        region: { type: String, trim: true, default: "" },
        material: { type: String, trim: true, default: "" },
        usage: { type: String, trim: true, default: "" },
        picture: { type: String, default: "" },
    },
    { timestamps: true }
);

const researcherReportSchema = new Schema(
    {
        discoveryReport: {
            type: Schema.Types.ObjectId,
            ref: "DiscoveryReport",
            required: true,
            unique: true, // One Researcher Report draft per Discovery Report
        },
        researcher: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Will notify if there indeed is possible artifact
        possibleArtifact: {
            type: Boolean,
            default: false,
        },

        // Add notes
        notes: {
            type: String,
            default: "",
        },

        // Request for further budget
        budgetRequested: {
            type: Number,
            default: null,
        },

        // Request for excavation team (which we mentioned as engineers) to be assigned
        requestExcavationTeam: {
            type: Boolean,
            default: false,
        },

        // Report Approval & Artifact Allocation: artifacts found on site, added
        // by the archaeologist while the report is still a Draft.
        artifacts: [foundArtifactSchema],

        // Workflow state: draft -> pending admin approval -> approved
        status: {
            type: String,
            enum: ["Draft", "Pending", "Approved"],
            default: "Draft",
        },

        // Filled in once the Government/Admin approves the final report
        adminReview: {
            reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
            reviewedAt: { type: Date, default: null },
            notes: { type: String, default: "" },
        },

        // Catalogue items created (in Smart Artifact Search) from `artifacts`
        // once this report is approved by the admin.
        allocatedItems: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("ResearcherReport", researcherReportSchema);
