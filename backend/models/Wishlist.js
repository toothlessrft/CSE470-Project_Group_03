const mongoose = require("mongoose");
const { Schema } = mongoose;

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  },
  { timestamps: { createdAt: "added_at", updatedAt: false } }
);

wishlistSchema.index({ user: 1, item: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
