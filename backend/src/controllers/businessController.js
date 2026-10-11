import Business from "../models/Business.js";

export const createBusiness = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            address,
            city,
            contactNumber,
            website,
            openingHours
        } = req.body;

        // 1. Validate required fields
        if (
            !name ||
            !category ||
            !address ||
            !city ||
            !contactNumber
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, category, address, city and contact number are required"
            });
        }

        // 2. Check whether this owner already has a business
        const existingBusiness = await Business.findOne({
            ownerId: req.user.userId
        });

        if (existingBusiness) {
            return res.status(409).json({
                success: false,
                message: "You already have a registered business"
            });
        }

        // 3. Create business
        const business = await Business.create({
            ownerId: req.user.userId,
            name,
            description,
            category,
            address,
            city,
            contactNumber,
            website,
            openingHours
        });

        // 4. Send response
        return res.status(201).json({
            success: true,
            message: "Business created successfully",
            business
        });
    } catch (error) {
        console.error("Create business error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export  const  getBusinessByOwner = async(req,res)=>{
    try{
        const business = await Business.findOne({ownerId:req.user.userId});
        if(!business){
            return res.status(404).json({
                success:false,
                message:"No business found for this owner"
            });
        }

        return res.status(200).json({
            success:true,
            message:"Business retrieved successfully",
            business
        });





    }catch(error){
        console.error("Get business by owner error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
