import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getBusinessCustomers,
  getBusinessCustomerById,
} from "../controllers/businessCustomerController.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("BUSINESS_OWNER"));

router.get("/", getBusinessCustomers);
router.get("/:customerId", getBusinessCustomerById);

export default router;