import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true
        }
    },
    { timestamps: true }
);

favoriteSchema.index(
    { customerId: 1, businessId: 1 },
    { unique: true }
);

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;