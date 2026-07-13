//Researcher Report: Ahad
const mongoose = require("mongoose");
const { Schema } = mongoose;

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


        // Workflow state: draft vs final
        status: {
            type: String,
            enum: ["Draft", "Submitted"],
            default: "Draft",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ResearcherReport", researcherReportSchema);
