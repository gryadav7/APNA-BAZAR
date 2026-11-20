import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import CustomerProfile from "../models/CustomerProfile.js";
import mongoose from "mongoose";

// Get all unique customers of the logged-in business.
export const getBusinessCustomers = async (req, res) => {
  try {
    // Find all unique customer IDs who have appointments with this business.
    const customerIds = await Appointment.distinct("customerId", {
      businessId: req.business._id,
    });

    // Return an empty list if no customers exist.
    if (customerIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Fetch customer user details without passwords.
    const customers = await User.find({
      _id: { $in: customerIds },
      role: "CUSTOMER",
    })
      .select("-password")
      .sort({ name: 1 })
      .lean();

    // Fetch additional customer profile information.
    const profiles = await CustomerProfile.find({
      userId: { $in: customerIds },
    }).lean();

    // Create a lookup map for customer profiles.
    const profileMap = new Map(
      profiles.map((profile) => [
        profile.userId.toString(),
        profile,
      ])
    );

    // Combine user and profile information.
    const result = customers.map((customer) => ({
      ...customer,
      profile: profileMap.get(customer._id.toString()) || null,
    }));

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });

  } catch (error) {
    console.error("Get business customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};




// Get details of a specific customer of the logged-in business.
export const getBusinessCustomerById = async (req, res) => {
    try {
        const  customerId  = req.params.customerId.trim();

        // Validate customer ID.
        if (!mongoose.isValidObjectId(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });
        }

        // Check whether this customer has an appointment with this business.
        const appointment = await Appointment.findOne({
            customerId,
            businessId: req.business._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Customer not found for this business."
            });
        }

        // Fetch customer details without password.
        const customer = await User.findOne({
            _id: customerId,
            role: "CUSTOMER"
        }).select("-password");

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        // Fetch only basic profile information.
        const profile = await CustomerProfile.findOne({
            userId: customerId
        }).select("address city");

        return res.status(200).json({
            success: true,
            data: {
                ...customer.toObject(),
                profile
            }
        });

    } catch (error) {
        console.error("Get business customer error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};



export const getCustomerAppointments = async (req, res) => {
    try {
        const customerId = req.params.customerId.trim();

        // Validate customer ID.
        if (!mongoose.isValidObjectId(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });
        }

        // Verify that the customer has an appointment with this business.
        const customerExists = await Appointment.exists({
            customerId,
            businessId: req.business._id
        });

        if (!customerExists) {
            return res.status(404).json({
                success: false,
                message: "Customer not found for this business."
            });
        }

        // Fetch this customer's appointment history for this business.
        const appointments = await Appointment.find({
            customerId,
            businessId: req.business._id
        })
            .populate("serviceId", "name price duration")
            .sort({ date: -1, time: -1 });

        return res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });

    } catch (error) {
        console.error("Get customer appointments error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};
