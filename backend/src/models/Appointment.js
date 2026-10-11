import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            index: true
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BusinessService",
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/
        },
        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "REJECTED",
                "COMPLETED",
                "CANCELLED"
            ],
            default: "PENDING"
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        notes: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;