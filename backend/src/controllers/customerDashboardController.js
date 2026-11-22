
import Appointment from "../models/Appointment.js";
import Favorite from "../models/Favorite.js";
import Review from "../models/Review.js";

export const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const now = new Date();

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      totalFavorites,
      totalReviews,
      upcomingAppointments,
      recentAppointments,
    ] = await Promise.all([
      Appointment.countDocuments({ customerId }),

      Appointment.countDocuments({
        customerId,
        status: "PENDING",
      }),

      Appointment.countDocuments({
        customerId,
        status: "CONFIRMED",
      }),

      Appointment.countDocuments({
        customerId,
        status: "COMPLETED",
      }),

      Appointment.countDocuments({
        customerId,
        status: "CANCELLED",
      }),

      Favorite.countDocuments({ customerId }),
      Review.countDocuments({ customerId }),

      Appointment.find({
        customerId,
        status: "CONFIRMED",
        date: { $gte: now },
      })
        .populate("businessId", "name category address city")
        .populate("serviceId", "name price duration")
        .sort({ date: 1, time: 1 })
        .limit(5),

      Appointment.find({ customerId })
        .populate("businessId", "name category city")
        .populate("serviceId", "name price")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
        },
        totalFavorites,
        totalReviews,
        upcomingAppointments,
        recentAppointments,
      },
    });
  } catch (error) {
    console.error("Customer dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
