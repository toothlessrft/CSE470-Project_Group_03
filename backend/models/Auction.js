const mongoose = require("mongoose");
const { Schema } = mongoose;

/*
  Auction & Bidding System (Government/Admin creates, registered users bid).

  Lifecycle:
    Active -> Closed-Sold      (deadline passed, a bid met/exceeded the reserve)
    Active -> Closed-Unsold    (deadline passed, no bids or reserve never met)
    Active -> Cancelled        (admin ends it early, with a reason)

  current_bid/current_bidder are denormalized onto the auction itself so the
  list/detail views don't need to aggregate the Bid collection on every read.
  The Bid collection is still kept as the full, append-only history.
*/
const auctionSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },

    starting_bid: { type: Number, required: true, min: 0 },
    min_increment: { type: Number, required: true, min: 1 },
    reserve_price: { type: Number, default: null }, // hidden from bidders; optional

    deadline: { type: Date, required: true },

    // Anti-sniping: if a valid bid lands within `extend_trigger_minutes` of
    // the deadline, push the deadline back by `extend_by_minutes`.
    extend_trigger_minutes: { type: Number, default: 2, min: 0 },
    extend_by_minutes: { type: Number, default: 2, min: 0 },
    extension_count: { type: Number, default: 0 },

    current_bid: { type: Number, default: null },
    current_bidder: { type: Schema.Types.ObjectId, ref: "User", default: null },
    bid_count: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Active", "Closed-Sold", "Closed-Unsold", "Cancelled"],
      default: "Active",
    },
    cancel_reason: { type: String, default: "" },
    closed_at: { type: Date, default: null },

    winner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    final_price: { type: Number, default: null },
  },
  { timestamps: true }
);

auctionSchema.index({ status: 1, deadline: 1 });

module.exports = mongoose.model("Auction", auctionSchema);
