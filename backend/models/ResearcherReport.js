// Researcher Report - Ahad
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Artifacts the researcher lists as found on site. Draft entries only - they
// become real catalogue Items when the admin approves the report.
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

        // Notifies if there is a possible artifact
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

        // Asks for an excavation team to be assigned
        requestExcavationTeam: {
            type: Boolean,
            default: false,
        },

        // Artifacts added by the archaeologist while the report is a Draft.
        artifacts: [foundArtifactSchema],

        // Workflow state: draft -> pending admin approval -> approved
        status: {
            type: String,
            enum: ["Draft", "Pending", "Approved"],
            default: "Draft",
        },

        // Filled in once the admin approves the final report
        adminReview: {
            reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
            reviewedAt: { type: Date, default: null },
            notes: { type: String, default: "" },
        },

        // Catalogue items created from `artifacts` on approval.
        allocatedItems: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("ResearcherReport", researcherReportSchema);
