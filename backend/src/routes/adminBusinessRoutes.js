
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getAllBusinesses,
  getBusinessById,
  updateBusinessStatus,
  deleteBusiness,
} from "../controllers/adminBusinessController.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/", getAllBusinesses);
router.get("/:id", getBusinessById);
router.patch("/:id/status", updateBusinessStatus);
router.delete("/:id", deleteBusiness);

export default router;
