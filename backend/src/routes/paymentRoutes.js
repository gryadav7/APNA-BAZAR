import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  processSubscription,
  cancelSubscription,
  getAdminTransactions
} from "../controllers/paymentController.js";

const router = express.Router();

// Public: View subscription plans and pricing
router.get("/plans", getSubscriptionPlans);

// Business Owner: Get current subscription status & billing history
router.get(
  "/my-subscription",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  getCurrentSubscription
);

// Business Owner: Subscribe / Upgrade to Pro or Premium
router.post(
  "/subscribe",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  processSubscription
);

// Business Owner: Cancel subscription / Downgrade to Free
router.patch(
  "/cancel",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  cancelSubscription
);

// Admin: View all platform transactions & revenue metrics
router.get(
  "/admin/transactions",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAdminTransactions
);

export default router;
