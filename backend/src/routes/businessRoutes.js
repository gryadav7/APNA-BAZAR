
import express from "express";

// Business aur service ke controller functions
import {
  createBusiness,
  getBusinessByOwner,
  updateMyBusiness
} from "../controllers/businessController.js";

// Service create karne wala controller import karo
import { createService ,getMyServices , updateMyService,deleteMyService} from "../controllers/serviceController.js";

// Login aur role check karne wale middleware
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Business create karna: login + BUSINESS_OWNER required
router.post(
  "/",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  createBusiness
);

// Logged-in owner ka business fetch karna
router.get(
  "/my-business",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  getBusinessByOwner
);

// Logged-in owner ke business ki details update karna
router.put(
  "/my-business",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  updateMyBusiness
);

// Business ke liye nayi service create karna
router.post(
  "/my-business/services",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  createService
);

// Logged-in owner ki services fetch karne ka protected route
router.get(
  "/my-business/services",
  authMiddleware, // Login verify karo
  roleMiddleware("BUSINESS_OWNER"), // Owner role verify karo
  getMyServices // Controller execute karo
  
);



// Update a service belonging to the logged-in owner's business
router.put(
  "/my-business/services/:serviceId",
  authMiddleware, // Verify the user's login cookie and JWT
  roleMiddleware("BUSINESS_OWNER"), // Allow only business owners
  updateMyService // Execute the service update controller
);




// Delete a service belonging to the logged-in owner's business
router.delete(
  "/my-business/services/:serviceId",
  authMiddleware, // Verify the user's authentication
  roleMiddleware("BUSINESS_OWNER"), // Allow only business owners
  deleteMyService // Execute the delete controller
);




export default router;
