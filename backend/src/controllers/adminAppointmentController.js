import Appointment from "../models/Appointment.js";
import Business from "../models/Business.js";
import User from "../models/User.js";

// GET ALL APPOINTMENTS (ADMIN)
export const getAllAppointments = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    let appointments = await Appointment.find(filter)
      .populate("customerId", "name email phone")
      .populate("businessId", "name address city category phone")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 });

    // In-memory search filtering if search term provided
    if (req.query.search && req.query.search.trim()) {
      const q = req.query.search.trim().toLowerCase();
      appointments = appointments.filter((app) => {
        const custName = app.customerId?.name?.toLowerCase() || "";
        const custEmail = app.customerId?.email?.toLowerCase() || "";
        const bizName = app.businessId?.name?.toLowerCase() || "";
        const serviceName = app.serviceId?.name?.toLowerCase() || "";
        return (
          custName.includes(q) ||
          custEmail.includes(q) ||
          bizName.includes(q) ||
          serviceName.includes(q)
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Admin get appointments error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// UPDATE APPOINTMENT STATUS (ADMIN)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["PENDING", "CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"];

    if (!status || !allowed.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(", ")}`,
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: status.toUpperCase() },
      { new: true }
    )
      .populate("customerId", "name email phone")
      .populate("businessId", "name address city category phone")
      .populate("serviceId", "name price duration");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully by administrator.",
      appointment,
    });
  } catch (error) {
    console.error("Admin update appointment status error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
