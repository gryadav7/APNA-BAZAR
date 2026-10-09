const mongoose = require("mongoose");

const businessAvailabilitySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    day: {
      type: String,
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      required: true,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    openingTime: {
      type: String,
      required: function () {
        return this.isOpen;
      },
    },

    closingTime: {
      type: String,
      required: function () {
        return this.isOpen;
      },
    },
  },
  {
    timestamps: true,
  }
);

businessAvailabilitySchema.index(
  { businessId: 1, day: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "BusinessAvailability",
  businessAvailabilitySchema
);