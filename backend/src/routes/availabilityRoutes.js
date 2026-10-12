
import express from "express";

// Import the controller that creates business availability
import { createAvailability } from "../controllers/availabilityController.js";

// Import middleware to verify authentication and user role
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

// Create an Express router for availability endpoints
const router = express.Router();

// Allow authenticated business owners to create a schedule
router.post(
  "/",
  authMiddleware, // Verify the JWT cookie
  roleMiddleware("BUSINESS_OWNER"), // Restrict access to business owners
  createAvailability // Execute the availability controller
);

// Export the router so app.js can register it
export default router;
