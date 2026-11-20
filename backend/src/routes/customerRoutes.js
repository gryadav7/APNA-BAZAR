
import express from "express";

import {
    getBusinessCustomers,getBusinessCustomerById, getCustomerAppointments
} from "../controllers/customerController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import businessMiddleware from "../middleware/businessMiddleware.js";

const router = express.Router();

// Get all customers of the logged-in business.
router.get(
    "/",
    authMiddleware,
    roleMiddleware("BUSINESS_OWNER"),
    businessMiddleware,
    getBusinessCustomers
);


// Get details of a specific customer.
router.get(
    "/:customerId",
    authMiddleware,
    roleMiddleware("BUSINESS_OWNER"),
    businessMiddleware,
    getBusinessCustomerById
);



// Get appointment history of a specific customer.
router.get(
    "/:customerId/appointments",
    authMiddleware,
    roleMiddleware("BUSINESS_OWNER"),
    businessMiddleware,
    getCustomerAppointments
);


export default router;
