const mongoose = require("mongoose");
const { Schema } = mongoose;

const eTeamSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "ExcavationProject", required: true },
    teamNo: { type: Number, required: true },
    role: String, // what the team works on, e.g. "Painting Walls"
    manager: { type: Schema.Types.ObjectId, ref: "User" },
    member_list: String, // free-text comma separated list, same as the original
  },
  { timestamps: true }
);

eTeamSchema.index({ project: 1, teamNo: 1 }, { unique: true });

module.exports = mongoose.model("ETeam", eTeamSchema);
