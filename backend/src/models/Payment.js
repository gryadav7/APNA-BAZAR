import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    plan: {
      type: String,
      enum: ["PRO", "PREMIUM"],
      required: true
    },
    billingCycle: {
      type: String,
      enum: ["MONTHLY", "ANNUAL"],
      default: "MONTHLY"
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "INR"
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING"],
      required: true
    },
    paymentDetails: {
      upiId: { type: String, trim: true },
      cardLast4: { type: String, trim: true },
      cardNetwork: { type: String, trim: true },
      bankName: { type: String, trim: true }
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING", "REFUNDED"],
      default: "SUCCESS"
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    features: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
