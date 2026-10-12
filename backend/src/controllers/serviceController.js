
import Business from "../models/Business.js";
import BusinessService from "../models/BusinessService.js";

// Naya service create karne ke liye controller function
export const createService = async (req, res) => {
  try {
    // Frontend/Postman se service ki details nikaalo
    const { name, description, price, duration } = req.body;

    // Check karo ki name string hai aur empty nahi hai.
    // Price aur duration request mein diye gaye hain.
    if (
      typeof name !== "string" ||
      !name.trim() ||
      price === undefined ||
      duration === undefined
    ) {
      // Required fields missing hone par 400 response bhejo
      return res.status(400).json({
        success: false,
        message: "Name, price and duration are required"
      });
    }

    // Price number hona chahiye aur negative nahi hona chahiye.
    // Duration positive integer hona chahiye, jaise 30 minutes.
    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(duration) ||
      duration < 1
    ) {
      // Invalid values hone par request reject karo
      return res.status(400).json({
        success: false,
        message:
          "Price must be non-negative and duration must be a positive integer"
      });
    }

    // Login middleware JWT se userId req.user mein rakhta hai.
    // Is ID se logged-in owner ka business find karo.
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Agar owner ka business nahi mila, toh service create nahi hogi
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Please create your business first"
      });
    }

    // Database mein service ka naya document create karo.
    // businessId server se aa rahi hai, request body se nahi.
    const service = await BusinessService.create({
      businessId: business._id,
      name: name.trim(),
      description,
      price,
      duration
    });

    // 201 ka matlab hai ki naya resource create ho gaya
    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service
    });

  } catch (error) {
    // Error ki details development terminal mein log karo
    console.error("Create service error:", error.message);

    // Unexpected server error ke liye generic response bhejo
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};





// Logged-in owner ki saari services fetch karne ka controller
export const getMyServices = async (req, res) => {
  try {
    // JWT middleware se logged-in user ki ID milti hai.
    // Us ID se owner ka business database mein find karo.
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Business nahi mila toh uski services bhi nahi mil sakti
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Sirf isi business ki services fetch karo.
    // Isse doosre business ki services expose nahi hongi.
    const services = await BusinessService.find({
      businessId: business._id
    }).sort({ createdAt: -1 }); // Latest created service pehle

    // Services successfully fetch ho gayi hain
    return res.status(200).json({
      success: true,
      count: services.length, // Total services ki sankhya
      services
    });
  } catch (error) {
    // Development terminal mein actual error dekho
    console.error("Get services error:", error.message);

    // Unexpected error par generic response bhejo
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};




// Update an existing service owned by the logged-in business owner
export const updateMyService = async (req, res) => {
  try {
    // Get the service ID from the URL parameter
    const { serviceId } = req.params;

    // Define the only fields that this API allows users to update
    const allowedFields = [
      "name",
      "description",
      "price",
      "duration"
    ];

    // Create a new object containing only permitted fields
    const updates = {};

    // Copy only fields that were provided in the request body
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Reject the request if no allowed field was provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update"
      });
    }

    // Validate the service name when it is included in the update
    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Service name cannot be empty"
      });
    }

    // Validate the price as a non-negative finite number
    if (
      updates.price !== undefined &&
      (typeof updates.price !== "number" ||
        !Number.isFinite(updates.price) ||
        updates.price < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a non-negative number"
      });
    }

    // Validate the duration as a positive integer in minutes
    if (
      updates.duration !== undefined &&
      (!Number.isInteger(updates.duration) || updates.duration < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a positive integer"
      });
    }

    // Remove extra whitespace from text fields
    for (const field of ["name", "description"]) {
      if (typeof updates[field] === "string") {
        updates[field] = updates[field].trim();
      }
    }

    // Find the business owned by the authenticated user
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Stop if the authenticated user has no registered business
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Update only the service that belongs to this owner's business
    const service = await BusinessService.findOneAndUpdate(
      {
        _id: serviceId,
        businessId: business._id
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    // Return 404 if the service does not exist or belongs to another business
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // Return the updated service to the client
    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service
    });
  } catch (error) {
    // Log the actual error for debugging in the server terminal
    console.error("Update service error:", error.message);

    // Handle malformed MongoDB ObjectIds as invalid requests
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID"
      });
    }

    // Return a generic response for unexpected server errors
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};




// Delete a service owned by the authenticated business owner
export const deleteMyService = async (req, res) => {
  try {
    // Read the service ID from the URL parameter
    const { serviceId } = req.params;

    // Find the business belonging to the logged-in owner
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Stop if the owner does not have a registered business
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Find and delete only a service belonging to this business
    const deletedService = await BusinessService.findOneAndDelete({
      _id: serviceId,
      businessId: business._id
    });

    // Return 404 if the service does not exist or belongs to another business
    if (!deletedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // Confirm that the service was successfully deleted
    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      service: deletedService
    });
  } catch (error) {
    // Log the actual error for debugging
    console.error("Delete service error:", error.message);

    // Handle an incorrectly formatted MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID"
      });
    }

    // Return a generic response for unexpected errors
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
