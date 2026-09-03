// Project Team Group Chat - one row per message.
const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: "TeamChat", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    image: { type: String, default: "" }, // data URL, mirrors ImageUploader's convention
    // "X added Y" / "chat archived" style events, rendered inline without a bubble.
    system: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ chat: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
