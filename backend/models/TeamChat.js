// Project Team Group Chat (Archaeologist & Excavation Team)
const mongoose = require("mongoose");
const { Schema } = mongoose;

const participantSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Snapshot of the role at the time they were added.
    role: { type: String, default: "" },
    added_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    added_at: { type: Date, default: Date.now },
    // Drives the unread badge - anything newer than this that wasn't sent by
    // this user themselves counts as unread for them.
    last_read_at: { type: Date, default: null },
  },
  { _id: false }
);

const teamChatSchema = new Schema(
  {
    // One group chat per excavation project.
    project: { type: Schema.Types.ObjectId, ref: "ExcavationProject", required: true, unique: true },
    participants: [participantSchema],

    // Set automatically when the project is completed. Archived chats stay
    // readable in history, they just stop accepting new messages/members.
    archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeamChat", teamChatSchema);
