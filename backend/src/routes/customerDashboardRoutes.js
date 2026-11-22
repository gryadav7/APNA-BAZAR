import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getCustomerDashboard,
} from "../controllers/customerDashboardController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("CUSTOMER"),
  getCustomerDashboard
);

export default router;