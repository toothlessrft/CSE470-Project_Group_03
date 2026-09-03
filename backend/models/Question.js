// Public Archaeology Q&A
const mongoose = require("mongoose");
const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    askedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    images: [{ type: String }],

    // Denormalized so the list/filter views don't need a separate count query
    // per question; kept in sync in routes/qna.js whenever an answer is added.
    answeredCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ title: "text", body: "text" });

module.exports = mongoose.model("Question", questionSchema);
