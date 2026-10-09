const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessService",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "REJECTED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);