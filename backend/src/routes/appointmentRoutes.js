import express from "express";
import { createAppointment , getMyAppointments ,getBusinessAppointments , updateAppointmentStatus,cancelAppointment,
    completeAppointment , getAppointmentById
} from "../controllers/appointmentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Allow only authenticated customers to book appointments.
router.post(
    "/",
    authMiddleware,
    roleMiddleware("CUSTOMER"),
    createAppointment
);

// Return appointments for the logged-in customer.
router.get(
    "/my-appointments",
    authMiddleware,
    roleMiddleware("CUSTOMER"),
    getMyAppointments
);

// Allow business owners to view their business appointments.
router.get(
    "/business",
    authMiddleware,
    roleMiddleware("BUSINESS_OWNER"),
    getBusinessAppointments
);


// Business owner can confirm or reject an appointment.
router.patch(
    "/:appointmentId/status",
    authMiddleware,
    roleMiddleware("BUSINESS_OWNER"),
    updateAppointmentStatus
);


// Customer can cancel their own appointment.
router.patch(
    "/:appointmentId/cancel",
    authMiddleware,
    roleMiddleware("CUSTOMER"),
    cancelAppointment
);


// Business owner can mark a confirmed appointment as completed.
router.patch(
    "/:appointmentId/complete",
    authMiddleware,
    roleMiddleware("BUSINESS_OWNER"),
    completeAppointment
);

// Customer or business owner can view an authorized appointment.
router.get(
    "/:appointmentId",
    authMiddleware,
    roleMiddleware("CUSTOMER", "BUSINESS_OWNER"),
    getAppointmentById
);

export default router;
