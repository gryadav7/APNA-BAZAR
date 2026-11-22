
import mongoose from "mongoose";
import Business from "../models/Business.js";
import Appointment from "../models/Appointment.js";

// GET BUSINESS CUSTOMERS
export const getBusinessCustomers = async (req, res) => {
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

    const appointments = await Appointment.find({
      businessId: business._id,
    })
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    const customerMap = new Map();

    for (const appointment of appointments) {
      const customer = appointment.customerId;

      if (!customer) continue;

      const id = customer._id.toString();

      if (!customerMap.has(id)) {
        customerMap.set(id, {
          customer,
          totalAppointments: 0,
          lastAppointment: appointment.createdAt,
        });
      }

      const entry = customerMap.get(id);
      entry.totalAppointments += 1;
    }

    return res.status(200).json({
      success: true,
      totalCustomers: customerMap.size,
      customers: Array.from(customerMap.values()),
    });
  } catch (error) {
    console.error("Business customers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET SPECIFIC BUSINESS CUSTOMER
export const getBusinessCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const business = await Business.findOne({
      ownerId: req.user.userId,
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const appointments = await Appointment.find({
      businessId: business._id,
      customerId,
    })
      .populate("customerId", "name email phone")
      .populate("serviceId", "name price duration")
      .sort({ date: -1, time: -1 });

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found for this customer",
      });
    }

    return res.status(200).json({
      success: true,
      customer: appointments[0].customerId,
      totalAppointments: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Business customer details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
