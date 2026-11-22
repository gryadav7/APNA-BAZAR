import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getAllAppointments,
  updateAppointmentStatus,
} from "../controllers/adminAppointmentController.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/", getAllAppointments);
router.patch("/:id/status", updateAppointmentStatus);

export default router;
