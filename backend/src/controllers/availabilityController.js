
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





// Fetch the availability schedule of the logged-in business owner
export const getMyAvailability = async (req, res) => {
  try {
    // Find the business owned by the authenticated user
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Stop if the user has not registered a business
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Fetch all availability records for this business
    const availability = await BusinessAvailability.find({
      businessId: business._id
    }).sort({ day: 1 });

    // Return the schedule and the total number of records
    return res.status(200).json({
      success: true,
      count: availability.length,
      availability
    });
  } catch (error) {
    // Log the actual error for debugging
    console.error("Get availability error:", error.message);

    // Return a generic response for unexpected server errors
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};





// Kisi specific weekday ka schedule update karne ke liye
export const updateMyAvailability = async (req, res) => {
  try {
    // URL parameter se din (weekday) nikalo aur uppercase me convert karo
    const day = req.params.day.toUpperCase();

    // Application me jo weekdays allowed hain unki list
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY"
    ];

    // Agar din valid list me nahi hai to request reject kar do
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid weekday"
      });
    }

    // Request body se wo fields lo jo owner update karna chahta hai
    const { isOpen, openingTime, closingTime } = req.body;

    // Kam se kam ek field bheji gayi honi chahiye, warna update ka matlab nahi
    if (
      isOpen === undefined &&
      openingTime === undefined &&
      closingTime === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update"
      });
    }

    // Agar isOpen aaya hai to wo sirf true/false (boolean) hona chahiye
    if (isOpen !== undefined && typeof isOpen !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOpen must be true or false"
      });
    }

    // Logged-in user ka business dhundo
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Agar user ne business register hi nahi kiya to yahin ruk jao
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Is business aur is din ka purana schedule database se nikalo
    const existing = await BusinessAvailability.findOne({
      businessId: business._id,
      day
    });

    // Update tabhi hoga jab schedule pehle se exist karta ho
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Availability for this day was not found"
      });
    }

    // Update ke baad business open rahega ya band, ye pehle se decide kar lo
    // (naya isOpen mila to wo, warna purani value)
    const willBeOpen =
      isOpen !== undefined ? isOpen : existing.isOpen;

    // Agar business open rahega tabhi timings ko validate karna hai
    if (willBeOpen) {
      // Naya time mila to wo use karo, warna purana time hi rakho
      const nextOpeningTime =
        openingTime !== undefined
          ? openingTime
          : existing.openingTime;

      const nextClosingTime =
        closingTime !== undefined
          ? closingTime
          : existing.closingTime;

      // 24-hour HH:mm format check karne wala regex (jaise 09:30, 18:00)
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

      // Dono time string hone chahiye aur sahi HH:mm format me bhi
      if (
        typeof nextOpeningTime !== "string" ||
        typeof nextClosingTime !== "string" ||
        !timePattern.test(nextOpeningTime) ||
        !timePattern.test(nextClosingTime)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid opening and closing times are required in HH:mm format"
        });
      }

      // Closing time opening time se baad ka hona chahiye
      // (HH:mm string hai isliye direct string comparison sahi chalta hai)

      if (nextClosingTime <= nextOpeningTime) {
        return res.status(400).json({
          success: false,
          message: "Closing time must be later than opening time"
        });
      }
    }

    // Sirf wahi fields update me daalo jo humne allow ki hain
    const updates = {};

    if (isOpen !== undefined) {
      updates.isOpen = isOpen;
    }

    // Timings tabhi save karo jab final schedule "open" ho
    if (willBeOpen) {
      if (openingTime !== undefined) {
        updates.openingTime = openingTime;
      }

      if (closingTime !== undefined) {
        updates.closingTime = closingTime;
      }
    }

    // MongoDB ke liye $set operator ke saath update query banao
    const updateQuery = { $set: updates };

    // Agar owner us din ko band kar raha hai to purane timings hata do
    if (!willBeOpen) {
      updateQuery.$unset = {
        openingTime: 1,
        closingTime: 1
      };
    }

    // Sirf isi business ke is din ka schedule update karo
    // new: true -> updated document wapas milega
    // runValidators: true -> schema ke validation update par bhi chalenge
    const availability = await BusinessAvailability.findOneAndUpdate(
      {
        businessId: business._id,
        day
      },
      updateQuery,
      {
        new: true,
        runValidators: true
      }
    );

    // Updated schedule client ko wapas bhej do
    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      availability
    });
  } catch (error) {
    // Asli error debugging ke liye server console me log karo
    console.error("Update availability error:", error.message);

    // Schema validation ya galat data type (CastError) wale errors handle karo
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability data"
      });
    }

    // Baaki koi bhi unexpected error aaye to generic server error bhejo
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};




// Delete the availability record for a specific weekday
export const deleteMyAvailability = async (req, res) => {
  try {
    // Read the weekday from the URL parameter
    const day = req.params.day.toUpperCase();

    // Define the weekdays supported by the application
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY"
    ];

    // Reject invalid weekday values
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid weekday"
      });
    }

    // Find the business belonging to the logged-in owner
    const business = await Business.findOne({
      ownerId: req.user.userId
    });

    // Stop if the owner has no registered business
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // Delete only the schedule that belongs to this business and weekday
    const deletedAvailability =
      await BusinessAvailability.findOneAndDelete({
        businessId: business._id,
        day
      });

    // Return 404 if no matching schedule exists
    if (!deletedAvailability) {
      return res.status(404).json({
        success: false,
        message: "Availability for this day was not found"
      });
    }

    // Confirm that the schedule was deleted successfully
    return res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
      availability: deletedAvailability
    });
  } catch (error) {
    // Log the actual error for debugging
    console.error("Delete availability error:", error.message);

    // Return a generic response for unexpected server errors
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
