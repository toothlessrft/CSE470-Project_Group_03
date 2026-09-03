// Public Archaeology Q&A - discussion thread on a question.
const mongoose = require("mongoose");
const { Schema } = mongoose;

const qnaCommentSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QnAComment", qnaCommentSchema);
