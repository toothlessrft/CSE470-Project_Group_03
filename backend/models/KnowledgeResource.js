const mongoose = require("mongoose");
const { Schema } = mongoose;

const knowledgeResourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["research_paper", "book", "article", "historical_reference", "vlog_audio"],
    },
    author: { type: String, default: "" },
    content: { type: String, default: "" },
    url: { type: String, default: "" },
    // Only used for the "vlog_audio" (Excavation Diaries) category, where the
    // uploaded material is a photo or video rather than a text link.
    mediaType: { type: String, enum: ["photo", "video", null], default: null },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KnowledgeResource", knowledgeResourceSchema);
