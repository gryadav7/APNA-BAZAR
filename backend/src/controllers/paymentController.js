import Business from "../models/Business.js";
import Payment from "../models/Payment.js";

// Plan Configurations
export const PLANS = {
  FREE: {
    id: "FREE",
    name: "Starter",
    badge: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Essential discovery features for new local businesses starting out.",
    features: [
      "Standard listing in business directory",
      "Up to 5 active service offerings",
      "Customer appointment booking",
      "Basic business dashboard metrics",
      "Standard customer reviews & ratings"
    ]
  },
  PRO: {
    id: "PRO",
    name: "Pro Business",
    badge: "PRO",
    monthlyPrice: 999,
    annualPrice: 9999, // ~₹833/mo (Save 17%)
    description: "Accelerate your local reach with verified badge, priority ranking, and unlimited services.",
    features: [
      "Verified 'PRO' Blue Badge on search & details",
      "Unlimited active services & customizable durations",
      "Priority search placement above Starter listings",
      "Direct customer phone & email instant visibility",
      "Revenue & customer booking retention analytics",
      "Priority customer & technical support"
    ]
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium Elite",
    badge: "PREMIUM",
    monthlyPrice: 1999,
    annualPrice: 19999, // ~₹1666/mo (Save 17%)
    description: "Maximum prominence with top-tier search placement, homepage feature, and VIP tools.",
    features: [
      "Exclusive 'PREMIUM' Gold Crown Badge across platform",
      "Top-Spot VIP algorithm boost in all search queries",
      "Featured on Homepage top recommended carousel",
      "Automated appointment alerts & reminders",
      "Zero platform commission on all appointments",
      "Dedicated account manager & 24/7 VIP hotline"
    ]
  }
};

// Helper: detect card network
function detectCardNetwork(cardNumber = "") {
  const clean = cardNumber.replace(/\s+/g, "");
  if (clean.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(clean)) return "MasterCard";
  if (/^3[47]/.test(clean)) return "American Express";
  if (/^6(011|5)/.test(clean)) return "Discover";
  if (/^(508[5-9]|6521[5-9]|652[2-9]|6530|6531)/.test(clean)) return "RuPay";
  return "RuPay / Card";
}

// 1. GET ALL SUBSCRIPTION PLANS (PUBLIC / AUTH)
export const getSubscriptionPlans = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      plans: Object.values(PLANS)
    });
  } catch (error) {
    console.error("Get plans error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch subscription plans."
    });
  }
};

// 2. GET CURRENT BUSINESS SUBSCRIPTION & PAYMENT HISTORY (BUSINESS_OWNER)
export const getCurrentSubscription = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.userId });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "No business found for this owner. Please create your business first."
      });
    }

    // Check expiration
    const now = new Date();
    let currentTier = business.subscriptionTier || "FREE";
    let isExpired = false;

    if (
      currentTier !== "FREE" &&
      business.subscriptionExpiresAt &&
      new Date(business.subscriptionExpiresAt) < now
    ) {
      isExpired = true;
      currentTier = "FREE";
      business.subscriptionTier = "FREE";
      business.subscriptionExpiresAt = null;
      await business.save();
    }

    const payments = await Payment.find({ businessId: business._id }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      currentPlan: currentTier,
      planDetails: PLANS[currentTier] || PLANS.FREE,
      expiresAt: business.subscriptionExpiresAt,
      isExpired,
      business: {
        _id: business._id,
        name: business.name,
        category: business.category,
        subscriptionTier: business.subscriptionTier
      },
      history: payments
    });
  } catch (error) {
    console.error("Get current subscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load current subscription."
    });
  }
};

// 3. PROCESS SUBSCRIPTION UPGRADE & PAYMENT (BUSINESS_OWNER)
export const processSubscription = async (req, res) => {
  try {
    const {
      plan,
      billingCycle = "MONTHLY",
      paymentMethod,
      upiId,
      cardNumber,
      bankName
    } = req.body;

    // Validate plan
    if (!plan || !["PRO", "PREMIUM"].includes(plan.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan. Must be 'PRO' or 'PREMIUM'."
      });
    }

    const normalizedPlan = plan.toUpperCase();
    const normalizedCycle = billingCycle.toUpperCase() === "ANNUAL" ? "ANNUAL" : "MONTHLY";

    // Validate payment method
    if (!paymentMethod || !["UPI", "CARD", "NETBANKING"].includes(paymentMethod.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid payment method (UPI, CARD, or NETBANKING)."
      });
    }

    const normalizedMethod = paymentMethod.toUpperCase();
    const paymentDetails = {};

    if (normalizedMethod === "UPI") {
      if (!upiId || !upiId.trim() || !upiId.includes("@")) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid UPI Virtual Payment Address (e.g. yourname@okhdfcbank)."
        });
      }
      paymentDetails.upiId = upiId.trim();
    } else if (normalizedMethod === "CARD") {
      const cleanCard = (cardNumber || "").replace(/\s+/g, "");
      if (!cleanCard || cleanCard.length < 12 || cleanCard.length > 19) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 16-digit debit or credit card number."
        });
      }
      paymentDetails.cardLast4 = cleanCard.slice(-4);
      paymentDetails.cardNetwork = detectCardNetwork(cleanCard);
    } else if (normalizedMethod === "NETBANKING") {
      if (!bankName || !bankName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please select your bank for NetBanking authentication."
        });
      }
      paymentDetails.bankName = bankName.trim();
    }

    // Find business
    const business = await Business.findOne({ ownerId: req.user.userId });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "No business found for this owner. Please create your business first."
      });
    }

    // Determine amount
    const planConfig = PLANS[normalizedPlan];
    const amount = normalizedCycle === "ANNUAL" ? planConfig.annualPrice : planConfig.monthlyPrice;

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (normalizedCycle === "ANNUAL") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    // Generate unique transaction ID
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `TXN_APNA_${Date.now()}_${randomHex}`;

    // Create Payment Record
    const payment = await Payment.create({
      businessId: business._id,
      ownerId: req.user.userId,
      plan: normalizedPlan,
      billingCycle: normalizedCycle,
      amount,
      currency: "INR",
      paymentMethod: normalizedMethod,
      paymentDetails,
      transactionId,
      status: "SUCCESS",
      startDate,
      endDate,
      features: planConfig.features
    });

    // Update Business Model
    business.subscriptionTier = normalizedPlan;
    business.subscriptionExpiresAt = endDate;
    await business.save();

    return res.status(201).json({
      success: true,
      message: `Congratulations! Your business is now upgraded to ${planConfig.name} (${normalizedCycle}).`,
      subscription: {
        plan: normalizedPlan,
        billingCycle: normalizedCycle,
        amount,
        startDate,
        endDate,
        transactionId
      },
      payment,
      business: {
        _id: business._id,
        name: business.name,
        subscriptionTier: business.subscriptionTier,
        subscriptionExpiresAt: business.subscriptionExpiresAt
      }
    });
  } catch (error) {
    console.error("Process subscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment."
    });
  }
};

// 4. CANCEL AUTO-RENEWAL / DOWNGRADE TO FREE (BUSINESS_OWNER)
export const cancelSubscription = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.userId });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found."
      });
    }

    business.subscriptionTier = "FREE";
    business.subscriptionExpiresAt = null;
    await business.save();

    return res.status(200).json({
      success: true,
      message: "Subscription downgraded to Starter Free.",
      business
    });
  } catch (error) {
    console.error("Cancel subscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel subscription."
    });
  }
};

// 5. GET ALL PLATFORM TRANSACTIONS & REVENUE (ADMIN)
export const getAdminTransactions = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("businessId", "name category city contactNumber subscriptionTier")
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 });

    const totalRevenue = payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const proCount = await Business.countDocuments({
      subscriptionTier: "PRO",
      status: "ACTIVE"
    });

    const premiumCount = await Business.countDocuments({
      subscriptionTier: "PREMIUM",
      status: "ACTIVE"
    });

    return res.status(200).json({
      success: true,
      count: payments.length,
      metrics: {
        totalRevenue,
        proCount,
        premiumCount,
        totalTransactions: payments.length
      },
      transactions: payments
    });
  } catch (error) {
    console.error("Admin transactions error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch platform transactions."
    });
  }
};
