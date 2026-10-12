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


// Controller: lets a logged-in business owner update their own business

export const updateMyBusiness = async (req, res) => {
  try {
    // Only these fields are allowed to be changed.
    // Anything else (like ownerId) sent by the client is ignored.
    const allowedFields = [
      "name",
      "description",
      "category",
      "address",
      "city",
      "contactNumber",
      "website",
      "openingHours"
    ];

    // Empty object. We will put only the valid fields from the request here.
    const updates = {};

    // Step 1: Copy allowed fields from req.body into updates.
    // A field is copied only if the client actually sent it.
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Step 2: If nothing valid was sent, updates is still empty.
    // Object.keys(updates).length counts how many fields it holds.
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid field to update"
      });
    }

    // Step 3: These important fields must not be blank or the wrong type.
    for (const field of [
      "name",
      "category",
      "address",
      "city",
      "contactNumber"
    ]) {
      if (
        updates[field] !== undefined &&          // the client sent this field
        (typeof updates[field] !== "string" ||   // but it is not text (e.g. 123, null)
          !updates[field].trim())                // or it is empty / only spaces
      ) {
        // e.g. "city cannot be empty"
        return res.status(400).json({
          success: false,
          message: `${field} cannot be empty`
        });
      }
    }

    // Step 4: Remove extra spaces from the start and end of every text value.
    // "  Pizza Shop  " becomes "Pizza Shop"
    for (const field of Object.keys(updates)) {
      if (typeof updates[field] === "string") {
        updates[field] = updates[field].trim();
      }
    }

    // Step 5: Find the business that belongs to the logged-in user and update it.
    const business = await Business.findOneAndUpdate(
      { ownerId: req.user.userId },  // find by owner (taken from login, not from req.body)
      { $set: updates },             // change only these fields, keep the rest as is
      {
        new: true,                   // return the updated document, not the old one
        runValidators: true          // apply the schema rules on update too
      }
    );

    // Step 6: No business found for this user.
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Step 7: Success. Send back the updated business.
    return res.status(200).json({
      success: true,
      message: "Business updated successfully",
      business
    });
  } catch (error) {
    // Any unexpected error lands here.
    // Log the real error on the server for debugging.
    console.error("Update business error:", error.message);

    // Send a generic message so internal details don't leak to the client.
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};