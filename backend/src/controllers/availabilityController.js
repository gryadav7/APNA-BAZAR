
import Business from "../models/Business.js";
import BusinessAvailability from "../models/BusinessAvailability.js";

// Create or save the availability schedule for a business
export const createAvailability = async (req, res) => {
  try {
    // Read the schedule details from the request body
    const { day, isOpen, openingTime, closingTime } = req.body;

    // Define the weekdays accepted by the application
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY"
    ];

    // Ensure that the supplied day is valid
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid weekday"
      });
    }

    // Ensure that isOpen is explicitly provided as a boolean
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOpen must be true or false"
      });
    }

    // Validate the time fields only when the business is open
    if (isOpen) {
      // Check that both opening and closing times are provided
      if (!openingTime || !closingTime) {
        return res.status(400).json({
          success: false,
          message: "Opening and closing times are required"
        });
      }

      // Check that both times use the 24-hour HH:mm format
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

      if (
        !timePattern.test(openingTime) ||
        !timePattern.test(closingTime)
      ) {
        return res.status(400).json({
          success: false,
          message: "Times must use HH:mm format"
        });
      }

      // Ensure that closing time is later than opening time
      if (closingTime <= openingTime) {
        return res.status(400).json({
          success: false,
          message: "Closing time must be later than opening time"
        });
      }
    }

    // Find the business owned by the authenticated user
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Stop if the owner has not registered a business
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Build the schedule data using the verified business ID
    const availabilityData = {
      businessId: business._id,
      day,
      isOpen,
      // Closed days do not need opening or closing times
      openingTime: isOpen ? openingTime : undefined,
      closingTime: isOpen ? closingTime : undefined
    };

    // Create a new availability document in MongoDB
    const availability = await BusinessAvailability.create(
      availabilityData
    );

    // Return the newly created schedule
    return res.status(201).json({
      success: true,
      message: "Business availability created successfully",
      availability
    });
  } catch (error) {
    // Log the actual error for debugging
    console.error("Create availability error:", error.message);

    // Handle duplicate business/day records
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Availability for this day already exists"
      });
    }

    // Handle malformed MongoDB IDs or schema validation errors
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid availability data"
      });
    }

    // Return a generic response for unexpected server errors
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
