const mongoose = require("mongoose");
const { Schema } = mongoose;

const bidSchema = new Schema(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    bidder: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: "placed_at", updatedAt: false } }
);

bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ bidder: 1 });

module.exports = mongoose.model("Bid", bidSchema);
