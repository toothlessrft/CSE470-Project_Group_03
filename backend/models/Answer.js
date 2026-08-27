// Public Archaeology Q&A - an archaeologist's answer to a question.
const mongoose = require("mongoose");
const { Schema } = mongoose;

const answerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    answeredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Answer", answerSchema);
