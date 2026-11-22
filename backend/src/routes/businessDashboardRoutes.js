import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getBusinessDashboard,
} from "../controllers/businessDashboardController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  getBusinessDashboard
);

export default router;