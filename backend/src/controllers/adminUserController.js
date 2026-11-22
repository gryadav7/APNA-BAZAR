import User from "../models/User.js";
import Business from "../models/Business.js";
import BusinessService from "../models/BusinessService.js";
import BusinessAvailability from "../models/BusinessAvailability.js";
import Appointment from "../models/Appointment.js";
import CustomerProfile from "../models/CustomerProfile.js";

// GET ALL USERS (ADMIN)
export const getAllUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role.toUpperCase();
    }

    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin get all users error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// GET USER BY ID (ADMIN)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// UPDATE USER STATUS (ADMIN) - Block or unblock a customer or business owner
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'ACTIVE' or 'BLOCKED'",
      });
    }

    // Guard: Prevent admin from blocking themselves
    if (req.user && (req.user.userId === id || req.user._id?.toString() === id)) {
      return res.status(400).json({
        success: false,
        message: "Administrators cannot suspend or block their own active session.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account '${user.name}' has been ${status === "BLOCKED" ? "blocked" : "reactivated"} successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Admin update user status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update user status",
    });
  }
};

// DELETE USER (ADMIN) - Cascade delete user and associated businesses / appointments
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Guard: Prevent admin from deleting themselves
    if (req.user && (req.user.userId === id || req.user._id?.toString() === id)) {
      return res.status(400).json({
        success: false,
        message: "Administrators cannot delete their own active platform account.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    // Cascade operations based on user role
    if (user.role === "BUSINESS_OWNER") {
      // Find all businesses belonging to this owner
      const businesses = await Business.find({ ownerId: id });
      const businessIds = businesses.map((b) => b._id);

      if (businessIds.length > 0) {
        // Delete services and availability for these businesses
        await BusinessService.deleteMany({ businessId: { $in: businessIds } });
        await BusinessAvailability.deleteMany({ businessId: { $in: businessIds } });

        // Cancel pending/confirmed appointments for these businesses
        await Appointment.updateMany(
          { businessId: { $in: businessIds }, status: { $in: ["PENDING", "CONFIRMED"] } },
          { $set: { status: "CANCELLED", notes: "Cancelled due to business owner account deletion." } }
        );

        // Delete the businesses
        await Business.deleteMany({ ownerId: id });
      }
    } else if (user.role === "CUSTOMER") {
      // Cancel customer appointments
      await Appointment.updateMany(
        { customerId: id, status: { $in: ["PENDING", "CONFIRMED"] } },
        { $set: { status: "CANCELLED", notes: "Cancelled due to customer account deletion." } }
      );

      // Clean customer profile if exists
      await CustomerProfile.deleteMany({ customerId: id });
    }

    // Delete the user record
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `User account '${user.name}' (${user.email}) was permanently deleted.`,
      deletedUserId: id
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user account",
    });
  }
};
