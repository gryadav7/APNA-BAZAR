
import User from "../models/User.js";
import Business from "../models/Business.js";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalBusinessOwners,
      totalAdmins,
      activeUsers,
      blockedUsers,

      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      blockedBusinesses,
      proBusinesses,
      premiumBusinesses,
      freeBusinesses,

      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,

      totalTransactions,

      subscriptionRevenueAgg,
      bookingRevenueAgg
    ] = await Promise.all([
      // Users Breakdown
      User.countDocuments(),
      User.countDocuments({ role: "CUSTOMER" }),
      User.countDocuments({ role: "BUSINESS_OWNER" }),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments({ status: { $ne: "BLOCKED" } }),
      User.countDocuments({ status: "BLOCKED" }),

      // Business Moderation Breakdown
      Business.countDocuments(),
      Business.countDocuments({ status: "ACTIVE" }),
      Business.countDocuments({ status: "SUSPENDED" }),
      Business.countDocuments({ status: "BLOCKED" }),
      Business.countDocuments({ subscriptionTier: "PRO" }),
      Business.countDocuments({ subscriptionTier: "PREMIUM" }),
      Business.countDocuments({ subscriptionTier: { $in: ["FREE", null] } }),

      // Appointments
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "PENDING" }),
      Appointment.countDocuments({ status: "CONFIRMED" }),
      Appointment.countDocuments({ status: "COMPLETED" }),
      Appointment.countDocuments({ status: "CANCELLED" }),

      // Payments
      Payment.countDocuments({ status: "SUCCESS" }),

      // Aggregated Subscription Revenue
      Payment.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),

      // Aggregated Booking GMV (Completed Appointments)
      Appointment.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ])
    ]);

    const subscriptionRevenue = subscriptionRevenueAgg[0]?.total || 0;
    const bookingGMV = bookingRevenueAgg[0]?.total || 0;
    const totalPlatformRevenue = subscriptionRevenue + bookingGMV;

    return res.status(200).json({
      success: true,
      message: "Admin dashboard fetched successfully",
      dashboard: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          businessOwners: totalBusinessOwners,
          admins: totalAdmins,
          active: activeUsers,
          blocked: blockedUsers,
        },
        businesses: {
          total: totalBusinesses,
          active: activeBusinesses,
          suspended: suspendedBusinesses,
          blocked: blockedBusinesses,
          pro: proBusinesses,
          premium: premiumBusinesses,
          free: freeBusinesses,
        },
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
        },
        revenue: {
          subscriptionRevenue,
          bookingGMV,
          totalRevenue: totalPlatformRevenue,
          totalTransactions,
          activePaidSubscribers: proBusinesses + premiumBusinesses
        }
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
