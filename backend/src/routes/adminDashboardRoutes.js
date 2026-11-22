
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getAdminDashboard,
} from "../controllers/adminDashboardController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAdminDashboard
);

export default router;
