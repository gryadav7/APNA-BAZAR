import Appointment from "../models/Appointment.js";
import Business from "../models/Business.js";
import BusinessService from "../models/BusinessService.js";
import BusinessAvailability from "../models/BusinessAvailability.js";

// Create a new appointment for the authenticated customer.


export const createAppointment = async (req, res) => {
  try {
    const { businessId, serviceId, date, time, notes } = req.body;

    // Validate required fields.
    if (!businessId || !serviceId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Business, service, date and time are required.",
      });
    }

    // Validate MongoDB ObjectId formats.
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    if (
      typeof businessId !== "string" ||
      !objectIdPattern.test(businessId) ||
      typeof serviceId !== "string" ||
      !objectIdPattern.test(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID or service ID.",
      });
    }

    // Validate date format.
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (typeof date !== "string" || !datePattern.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must be in YYYY-MM-DD format.",
      });
    }

    // Reject invalid calendar dates.
    const requestedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(requestedDate.getTime()) ||
      requestedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date.",
      });
    }

    // Prevent booking for past dates.
    const today = new Date().toISOString().slice(0, 10);

    if (date < today) {
      return res.status(400).json({
        success: false,
        message: "Appointments cannot be booked for past dates.",
      });
    }

    // Validate time format.
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (typeof time !== "string" || !timePattern.test(time)) {
      return res.status(400).json({
        success: false,
        message: "Time must be in valid HH:mm format.",
      });
    }

    // Find the selected active business.
    const business = await Business.findById(businessId);

    if (!business || business.status !== "ACTIVE") {
      return res.status(404).json({
        success: false,
        message: "Active business not found.",
      });
    }

    // Verify that the service belongs to this business.
    const service = await BusinessService.findOne({
      _id: serviceId,
      businessId: business._id,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Active service not found for this business.",
      });
    }

    // Convert the requested date into weekday name.
    const weekdays = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    const day = weekdays[requestedDate.getUTCDay()];

    // Find business availability for the requested weekday.
    const availability = await BusinessAvailability.findOne({
      businessId: business._id,
      day,
    });

    // Reject booking if the business is closed.
    if (
      !availability ||
      !availability.isOpen ||
      !availability.openingTime ||
      !availability.closingTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Business is closed on the selected day.",
      });
    }

    // Convert HH:mm time into total minutes.
    const timeToMinutes = (timeString) => {
      const [hours, minutes] = timeString.split(":").map(Number);
      return hours * 60 + minutes;
    };

    // Calculate requested appointment start and end times.
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + service.duration;

    // Convert business hours into minutes.
    const openingMinutes = timeToMinutes(availability.openingTime);
    const closingMinutes = timeToMinutes(availability.closingTime);

    // Ensure the entire service fits within business hours.
    if (
      startMinutes < openingMinutes ||
      startMinutes >= closingMinutes ||
      endMinutes > closingMinutes
    ) {
      return res.status(400).json({
        success: false,
        message: "The service must finish within business hours.",
      });
    }

    // Fetch existing appointments and populate their service durations.
    const existingAppointments = await Appointment.find({
      businessId: business._id,
      date,
      status: { $in: ["PENDING", "CONFIRMED"] },
    }).populate("serviceId", "duration");

    // Check for overlapping appointments.
    for (const existing of existingAppointments) {
      // Ignore appointments with invalid time values.
      if (
        typeof existing.time !== "string" ||
        !timePattern.test(existing.time)
      ) {
        continue;
      }

      // Skip appointments whose service reference is unavailable.
      if (
        !existing.serviceId ||
        typeof existing.serviceId.duration !== "number"
      ) {
        continue;
      }

      // Calculate existing appointment time interval.
      const existingStart = timeToMinutes(existing.time);
      const existingEnd =
        existingStart + existing.serviceId.duration;

      // Check whether requested and existing intervals overlap.
      const overlaps =
        startMinutes < existingEnd &&
        existingStart < endMinutes;

      if (overlaps) {
        return res.status(409).json({
          success: false,
          message:
            "This time slot is already booked. Please choose another time.",
        });
      }
    }

    // Create appointment using trusted server-side values.
    const appointment = await Appointment.create({
      customerId: req.user.userId,
      businessId: business._id,
      serviceId: service._id,
      date,
      time,
      price: service.price,
      notes,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: appointment,
    });

  } catch (error) {
    console.error("Create appointment error:", error);

    // Handle invalid MongoDB IDs and schema validation errors.
    if (error.name === "CastError" || error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};



// Fetch appointments belonging to the authenticated customer.
export const getMyAppointments = async (req, res) => {
  try {
    // Find only appointments created by the logged-in customer.
    const appointments = await Appointment.find({
      customerId: req.user.userId,
    })
      .populate("businessId", "name address city")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get my appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};



// Fetch appointments for the logged-in business owner.
export const getBusinessAppointments = async (req, res) => {
  try {
    // Find the business owned by the authenticated user.
    const business = await Business.findOne({
      ownerId: req.user.userId,
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found.",
      });
    }

    // Fetch appointments belonging only to this business.
    const appointments = await Appointment.find({
      businessId: business._id,
    })
      .populate("customerId", "name email")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get business appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};



// Update appointment status by business owner.
export const updateAppointmentStatus = async (req, res) => {
  try {
    // Remove extra spaces from appointment ID.
const appointmentId = req.params.appointmentId.trim();
    const { status } = req.body;

    // Validate MongoDB ObjectId format.
    if (!/^[0-9a-fA-F]{24}$/.test(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    // Allow only CONFIRMED or REJECTED status.
    const allowedStatuses = ["CONFIRMED", "REJECTED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be CONFIRMED or REJECTED",
      });
    }

    // Find the business owned by the logged-in user.
    const business = await Business.findOne({
      ownerId: req.user.userId,
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Check whether the appointment belongs to this business.
    const existingAppointment = await Appointment.findOne({
      _id: appointmentId,
      businessId: business._id,
    });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Only pending appointments can be confirmed or rejected.
    if (existingAppointment.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Only pending appointments can be updated",
      });
    }

    // Update only if the appointment is still pending.
    const updatedAppointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        businessId: business._id,
        status: "PENDING",
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    // Handle a concurrent status change.
    if (!updatedAppointment) {
      return res.status(409).json({
        success: false,
        message: "Appointment status was already updated",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};





// Cancel an appointment by the authenticated customer.
export const cancelAppointment = async (req, res) => {
    try {
        // Remove extra spaces from appointment ID.
        const appointmentId = req.params.appointmentId.trim();

        // Validate MongoDB ObjectId format.
        if (!/^[0-9a-fA-F]{24}$/.test(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        // Find an appointment belonging to the logged-in customer.
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            customerId: req.user.userId
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Only pending or confirmed appointments can be cancelled.
        if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
            return res.status(409).json({
                success: false,
                message: "This appointment cannot be cancelled"
            });
        }

        // Update status only if it has not changed since the check.
        const cancelledAppointment = await Appointment.findOneAndUpdate(
            {
                _id: appointmentId,
                customerId: req.user.userId,
                status: { $in: ["PENDING", "CONFIRMED"] }
            },
            {
                $set: { status: "CANCELLED" }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!cancelledAppointment) {
            return res.status(409).json({
                success: false,
                message: "Appointment status has already changed"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            data: cancelledAppointment
        });

    } catch (error) {
        console.error("Cancel appointment error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};




// Mark a confirmed appointment as completed by the business owner.
export const completeAppointment = async (req, res) => {
    try {
        // Remove extra spaces from appointment ID.
        const appointmentId = req.params.appointmentId.trim();

        // Validate MongoDB ObjectId format.
        if (!/^[0-9a-fA-F]{24}$/.test(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        // Find the business owned by the logged-in user.
        const business = await Business.findOne({
            ownerId: req.user.userId
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        // Update only a confirmed appointment belonging to this business.
        const completedAppointment = await Appointment.findOneAndUpdate(
            {
                _id: appointmentId,
                businessId: business._id,
                status: "CONFIRMED"
            },
            {
                $set: { status: "COMPLETED" }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!completedAppointment) {
            return res.status(404).json({
                success: false,
                message: "Confirmed appointment not found for your business"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Appointment marked as completed",
            data: completedAppointment
        });

    } catch (error) {
        console.error("Complete appointment error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



// Get appointment details for the authorized customer or business owner.
export const getAppointmentById = async (req, res) => {
    try {
        // Remove extra spaces from appointment ID.
        const appointmentId = req.params.appointmentId.trim();

        // Validate MongoDB ObjectId format.
        if (!/^[0-9a-fA-F]{24}$/.test(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        // Find appointment and populate related business, service and customer details.
        const appointment = await Appointment.findById(appointmentId)
            .populate("businessId", "name address city contactNumber")
            .populate("serviceId", "name description price duration")
            .populate("customerId", "name email");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Allow customers to access only their own appointments.
        if (
            req.user.role === "CUSTOMER" &&
            appointment.customerId._id.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this appointment"
            });
        }

        // Allow business owners to access only their own business appointments.
        if (req.user.role === "BUSINESS_OWNER") {
            const business = await Business.findOne({
                ownerId: req.user.userId
            });

            if (
                !business ||
                appointment.businessId._id.toString() !== business._id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this appointment"
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Appointment details fetched successfully",
            data: appointment
        });

    } catch (error) {
        console.error("Get appointment details error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};






