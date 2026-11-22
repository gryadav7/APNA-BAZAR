
import Business from "../models/Business.js";
import BusinessService from "../models/BusinessService.js";
import Appointment from "../models/Appointment.js";

export const getBusinessDashboard = async (req, res) => {
  try {
    const business = await Business.findOne({
      ownerId: req.user.userId,
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const businessId = business._id;

    const [
      totalServices,
      activeServices,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      rejectedAppointments,
      cancelledAppointments,
      recentAppointments,
    ] = await Promise.all([
      BusinessService.countDocuments({ businessId }),
      BusinessService.countDocuments({
        businessId,
        isActive: true,
      }),

      Appointment.countDocuments({ businessId }),
      Appointment.countDocuments({
        businessId,
        status: "PENDING",
      }),
      Appointment.countDocuments({
        businessId,
        status: "CONFIRMED",
      }),
      Appointment.countDocuments({
        businessId,
        status: "COMPLETED",
      }),
      Appointment.countDocuments({
        businessId,
        status: "REJECTED",
      }),
      Appointment.countDocuments({
        businessId,
        status: "CANCELLED",
      }),

      Appointment.find({ businessId })
        .populate("customerId", "name phone")
        .populate("serviceId", "name price")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        business,
        services: {
          total: totalServices,
          active: activeServices,
        },
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          rejected: rejectedAppointments,
          cancelled: cancelledAppointments,
        },
        recentAppointments,
      },
    });
  } catch (error) {
    console.error("Business dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
