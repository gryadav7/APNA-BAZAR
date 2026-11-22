
import mongoose from "mongoose";
import Business from "../models/Business.js";
import BusinessService from "../models/BusinessService.js";
import BusinessAvailability from "../models/BusinessAvailability.js";
import Appointment from "../models/Appointment.js";

// GET ALL BUSINESSES
export const getAllBusinesses = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.city) {
      filter.city = req.query.city;
    }

    const businesses = await Business.find(filter)
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: businesses.length,
      businesses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BUSINESS BY ID

export const getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate("ownerId", "name email phone");

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// UPDATE BUSINESS STATUS
export const updateBusinessStatus = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Business status updated successfully",
      business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE BUSINESS (ADMIN) - Cascade deletion of business, services, availability, and cancellation of pending appointments
export const deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Cascade delete associated services
    await BusinessService.deleteMany({ businessId: id });

    // Cascade delete associated availability schedules
    await BusinessAvailability.deleteMany({ businessId: id });

    // Cancel pending and confirmed appointments linked to this business
    await Appointment.updateMany(
      { businessId: id, status: { $in: ["PENDING", "CONFIRMED"] } },
      { $set: { status: "CANCELLED", notes: "Cancelled due to business permanent deletion by platform administration." } }
    );

    // Delete the business document itself
    await Business.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Business "${business.name}" and all associated services were permanently deleted.`,
      deletedBusinessId: id
    });
  } catch (error) {
    console.error("Admin delete business error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete business",
    });
  }
};