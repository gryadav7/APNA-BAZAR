import mongoose from "mongoose";

const businessAvailabilitySchema = new mongoose.Schema(
    {
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true
        },
        day: {
            type: String,
            enum: [
                "MONDAY", "TUESDAY", "WEDNESDAY",
                "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
            ],
            required: true
        },
        isOpen: {
            type: Boolean,
            default: true
        },
        openingTime: {
            type: String,
            required: function () {
                return this.isOpen;
            },
            match: /^([01]\d|2[0-3]):[0-5]\d$/
        },
        closingTime: {
            type: String,
            required: function () {
                return this.isOpen;
            },
            match: /^([01]\d|2[0-3]):[0-5]\d$/
        }
    },
    { timestamps: true }
);

businessAvailabilitySchema.index(
    { businessId: 1, day: 1 },
    { unique: true }
);

const BusinessAvailability = mongoose.model(
    "BusinessAvailability",
    businessAvailabilitySchema
);

export default BusinessAvailability;