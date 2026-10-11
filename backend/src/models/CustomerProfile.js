import mongoose from "mongoose";

const customerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        address: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        dateOfBirth: {
            type: Date
        },
        gender: {
            type: String,
            enum: ["MALE", "FEMALE", "OTHER"]
        }
    },
    { timestamps: true }
);

const CustomerProfile = mongoose.model(
    "CustomerProfile",
    customerProfileSchema
);

export default CustomerProfile;