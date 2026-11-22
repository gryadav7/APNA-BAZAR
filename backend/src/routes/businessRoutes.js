import express from "express";

// Business controller functions
import {
  getAllBusinesses,
  getPublicBusinessById,
  getPublicBusinessServices,
  getPublicCategories,
  createBusiness,
  getBusinessByOwner,
  updateMyBusiness
} from "../controllers/businessController.js";

// Service controller functions
import {
  createService,
  getMyServices,
  updateMyService,
  deleteMyService
} from "../controllers/serviceController.js";

// Middleware
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// 1. PUBLIC MARKETPLACE ROUTES
// Browse active businesses with filters (category, city, search, sort, limit)
router.get("/", getAllBusinesses);

// List all active business categories
router.get("/categories", getPublicCategories);

// 2. BUSINESS OWNER PROFILE MANAGEMENT
// Create business profile (BUSINESS_OWNER required)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  createBusiness
);

// Fetch logged-in owner's business profile
router.get(
  "/my-business",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  getBusinessByOwner
);

// Update logged-in owner's business profile
router.put(
  "/my-business",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  updateMyBusiness
);

// 3. BUSINESS OWNER SERVICES MANAGEMENT
// Create new service
router.post(
  "/my-business/services",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  createService
);

// Fetch logged-in owner's services
router.get(
  "/my-business/services",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  getMyServices
);

// Update service
router.put(
  "/my-business/services/:serviceId",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  updateMyService
);

// Delete service
router.delete(
  "/my-business/services/:serviceId",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  deleteMyService
);

// 4. PUBLIC INDIVIDUAL BUSINESS & SERVICES (parameter route must be placed AFTER /my-business)
// Fetch public profile of a single business
router.get("/:businessId", getPublicBusinessById);

// Fetch public active services of a single business
router.get("/:businessId/services", getPublicBusinessServices);

export default router;
