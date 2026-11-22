import { useState, useEffect, useCallback } from "react";
import {
  FaCrown,
  FaCheckCircle,
  FaShieldAlt,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaCheck,
  FaTimes,
  FaLock,
  FaRedoAlt,
  FaReceipt,
  FaExclamationTriangle,
  FaBolt
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import paymentService from "../../services/paymentService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

// Pure date formatting helper
function formatPlanDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "N/A";
  }
}

// Pure currency formatter
function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function BusinessSubscription() {
  const { isMobile } = useResponsive();

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Plan switch toggle
  const [billingCycle, setBillingCycle] = useState("MONTHLY"); // MONTHLY | ANNUAL

  // Checkout Modal State
  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    plan: null // "PRO" | "PREMIUM"
  });

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState("UPI"); // UPI | CARD | NETBANKING
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Receipt inspection
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Load subscription and plans on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        const subRes = await paymentService.getCurrentSubscription().catch((err) => ({
          currentPlan: "FREE",
          history: [],
          business: null,
          loadErr: err.customMessage || err.message
        }));

        if (isMounted) {
          setSubscriptionData(subRes);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err.customMessage || err.message || "Failed to load subscription details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh
  const refreshSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const subRes = await paymentService.getCurrentSubscription();
      setSubscriptionData(subRes);
    } catch (err) {
      setLoadError(
        err.customMessage || err.message || "Failed to refresh subscription data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Format Card Number with Spaces
  function handleCardNumberChange(e) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  }

  // Format Expiry MM/YY
  function handleExpiryChange(e) {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setCardExpiry(raw);
  }

  // Open Checkout for a plan
  function handleOpenCheckout(planId) {
    setFormError("");
    setSuccessReceipt(null);
    setCheckoutModal({
      isOpen: true,
      plan: planId
    });
  }

  // Handle Payment Submit
  async function handlePaymentSubmit(e) {
    e.preventDefault();
    setFormError("");

    const targetPlan = checkoutModal.plan;
    if (!targetPlan) return;

    // Client-side validations
    if (paymentMethod === "UPI") {
      if (!upiId.trim() || !upiId.includes("@")) {
        setFormError("Please enter a valid UPI ID (e.g. yourname@okhdfcbank).");
        return;
      }
    } else if (paymentMethod === "CARD") {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (cleanCard.length < 15 || cleanCard.length > 16) {
        setFormError("Please enter a valid 16-digit debit or credit card number.");
        return;
      }
      if (cardExpiry.length < 5) {
        setFormError("Please enter card expiry in MM/YY format.");
        return;
      }
      if (cardCvv.length < 3) {
        setFormError("Please enter the 3-digit CVV from the back of your card.");
        return;
      }
    } else if (paymentMethod === "NETBANKING") {
      if (!selectedBank) {
        setFormError("Please select your bank.");
        return;
      }
    }

    try {
      setIsProcessing(true);

      const payload = {
        plan: targetPlan,
        billingCycle,
        paymentMethod,
        upiId: paymentMethod === "UPI" ? upiId.trim() : undefined,
        cardNumber: paymentMethod === "CARD" ? cardNumber.replace(/\s+/g, "") : undefined,
        cardExpiry: paymentMethod === "CARD" ? cardExpiry : undefined,
        cardCvv: paymentMethod === "CARD" ? cardCvv : undefined,
        bankName: paymentMethod === "NETBANKING" ? selectedBank : undefined
      };

      const res = await paymentService.subscribe(payload);

      // Update local state
      setSubscriptionData((prev) => ({
        ...prev,
        currentPlan: targetPlan,
        expiresAt: res.subscription?.endDate || res.payment?.endDate,
        business: {
          ...prev?.business,
          subscriptionTier: targetPlan
        },
        history: [res.payment, ...(prev?.history || [])]
      }));

      setSuccessReceipt(res.payment || res.subscription);
    } catch (err) {
      setFormError(
        err.customMessage || err.message || "Payment authorization failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  // Handle Cancel / Downgrade
  async function handleCancelSubscription() {
    try {
      setIsCancelling(true);
      await paymentService.cancelSubscription();

      setSubscriptionData((prev) => ({
        ...prev,
        currentPlan: "FREE",
        expiresAt: null,
        business: {
          ...prev?.business,
          subscriptionTier: "FREE"
        }
      }));

      setCancelModalOpen(false);
    } catch (err) {
      alert(err.customMessage || err.message || "Failed to cancel subscription.");
    } finally {
      setIsCancelling(false);
    }
  }

  // Pricing calculations
  const activePlanId = subscriptionData?.currentPlan || "FREE";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Loader size="lg" message="Loading subscription plans and billing history..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          background: COLORS.dangerBg,
          border: `1px solid ${COLORS.dangerBorder}`,
          borderRadius: RADIUS.medium,
          padding: "36px 24px",
          textAlign: "center",
          maxWidth: "600px",
          margin: "40px auto"
        }}
      >
        <FaExclamationTriangle size={36} color={COLORS.danger} style={{ marginBottom: "14px" }} />
        <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
          Unable to Load Subscription Data
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={refreshSubscription}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        boxSizing: "border-box"
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        <div>
          <h1 style={{ ...TYPOGRAPHY.h1, color: COLORS.secondary, margin: "0 0 6px" }}>
            Plans &amp; Subscriptions
          </h1>
          <p style={{ fontSize: "14px", color: COLORS.textSecondary, margin: 0 }}>
            Upgrade your business plan to get verified badges, priority search boost, and unlock VIP growth tools.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={refreshSubscription}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            alignSelf: isMobile ? "stretch" : "auto",
            justifyContent: "center"
          }}
        >
          <FaRedoAlt size={12} />
          <span>Refresh Status</span>
        </Button>
      </div>

      {/* Active Subscription Banner Card */}
      <div
        style={{
          background:
            activePlanId === "PREMIUM"
              ? "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)"
              : activePlanId === "PRO"
              ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
              : COLORS.surface,
          color: activePlanId === "FREE" ? COLORS.secondary : COLORS.white,
          border: `1px solid ${activePlanId === "FREE" ? COLORS.border : "transparent"}`,
          borderRadius: RADIUS.medium,
          padding: isMobile ? "20px" : "28px",
          boxShadow: SHADOWS.card,
          marginBottom: "32px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: "20px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: RADIUS.round,
              background:
                activePlanId === "PREMIUM"
                  ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                  : activePlanId === "PRO"
                  ? "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)"
                  : COLORS.surfaceSubtle,
              color: activePlanId === "FREE" ? COLORS.muted : COLORS.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              flexShrink: 0,
              boxShadow: activePlanId !== "FREE" ? SHADOWS.subtle : "none"
            }}
          >
            {activePlanId === "PREMIUM" ? (
              <FaCrown />
            ) : activePlanId === "PRO" ? (
              <FaShieldAlt />
            ) : (
              <FaBolt />
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: activePlanId === "FREE" ? COLORS.muted : "rgba(255, 255, 255, 0.7)"
                }}
              >
                Current Active Plan
              </span>
              <span
                style={{
                  background:
                    activePlanId === "PREMIUM"
                      ? "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
                      : activePlanId === "PRO"
                      ? "rgba(99, 102, 241, 0.2)"
                      : COLORS.surfaceSubtle,
                  color:
                    activePlanId === "PREMIUM"
                      ? "#B45309"
                      : activePlanId === "PRO"
                      ? "#A5B4FC"
                      : COLORS.muted,
                  padding: "2px 10px",
                  borderRadius: RADIUS.pill,
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.5px"
                }}
              >
                {activePlanId}
              </span>
            </div>

            <h2
              style={{
                margin: "0 0 6px",
                fontSize: isMobile ? "20px" : "24px",
                fontWeight: "800"
              }}
            >
              {activePlanId === "PREMIUM"
                ? "Premium Elite Plan"
                : activePlanId === "PRO"
                ? "Pro Business Plan"
                : "Starter Free Plan"}
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: activePlanId === "FREE" ? COLORS.textSecondary : "rgba(255, 255, 255, 0.8)",
                lineHeight: "1.5"
              }}
            >
              {activePlanId === "FREE" ? (
                "You are currently on the basic free tier. Upgrade to Pro or Premium to unlock priority search placement and verified badges."
              ) : (
                <>
                  Active &bull; Valid until{" "}
                  <strong>{formatPlanDate(subscriptionData?.expiresAt)}</strong>
                </>
              )}
            </p>
          </div>
        </div>

        {activePlanId !== "FREE" && (
          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              color: COLORS.white,
              border: "1px solid rgba(255, 255, 255, 0.25)",
              padding: "8px 16px",
              borderRadius: RADIUS.small,
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              alignSelf: isMobile ? "stretch" : "auto",
              textAlign: "center"
            }}
          >
            Downgrade to Free
          </button>
        )}
      </div>

      {/* Billing Cycle Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "36px"
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: billingCycle === "MONTHLY" ? "700" : "500",
            color: billingCycle === "MONTHLY" ? COLORS.secondary : COLORS.muted
          }}
        >
          Monthly Billing
        </span>

        <button
          type="button"
          onClick={() =>
            setBillingCycle((prev) => (prev === "MONTHLY" ? "ANNUAL" : "MONTHLY"))
          }
          style={{
            width: "56px",
            height: "30px",
            background: COLORS.primary,
            borderRadius: RADIUS.pill,
            border: "none",
            cursor: "pointer",
            position: "relative",
            padding: "3px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              background: COLORS.white,
              borderRadius: RADIUS.round,
              transform: billingCycle === "ANNUAL" ? "translateX(26px)" : "translateX(0)",
              transition: TRANSITIONS.default,
              boxShadow: SHADOWS.subtle
            }}
          />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: billingCycle === "ANNUAL" ? "700" : "500",
              color: billingCycle === "ANNUAL" ? COLORS.secondary : COLORS.muted
            }}
          >
            Annual Billing
          </span>
          <span
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              color: COLORS.success,
              border: `1px solid ${COLORS.successBorder}`,
              borderRadius: RADIUS.pill,
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: "800"
            }}
          >
            Save ~17%
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: "24px",
          marginBottom: "48px"
        }}
      >
        {/* Plan 1: Starter Free */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${activePlanId === "FREE" ? COLORS.primary : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "28px",
            boxShadow: SHADOWS.card,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: 0 }}>
                Starter Free
              </h3>
              {activePlanId === "FREE" && (
                <span
                  style={{
                    background: "rgba(79, 70, 229, 0.1)",
                    color: COLORS.primary,
                    borderRadius: RADIUS.pill,
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: "700"
                  }}
                >
                  Current Plan
                </span>
              )}
            </div>

            <p style={{ fontSize: "13px", color: COLORS.textSecondary, minHeight: "38px", margin: "0 0 16px" }}>
              Essential discovery features for new businesses establishing their presence.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: "800", color: COLORS.secondary }}>
                ₹0
              </span>
              <span style={{ fontSize: "13px", color: COLORS.muted }}> / forever</span>
            </div>

            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                paddingTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "28px"
              }}
            >
              {[
                "Standard listing in local directory",
                "Up to 5 active services",
                "Customer booking system",
                "Basic owner management dashboard",
                "Customer ratings & review collection"
              ].map((feat) => (
                <div key={feat} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: COLORS.secondary }}>
                  <FaCheck color={COLORS.success} size={12} style={{ marginTop: "3px", flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            disabled={activePlanId === "FREE"}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {activePlanId === "FREE" ? "Current Active Plan" : "Downgrade to Starter"}
          </Button>
        </div>

        {/* Plan 2: Pro Business */}
        <div
          style={{
            background: COLORS.surface,
            border: `2px solid ${activePlanId === "PRO" ? COLORS.primary : "#4F46E5"}`,
            borderRadius: RADIUS.medium,
            padding: "28px",
            boxShadow: SHADOWS.cardHover,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
        >
          {/* Most Popular Badge */}
          <div
            style={{
              position: "absolute",
              top: "-13px",
              left: "50%",
              transform: "translateX(-50%)",
              background: COLORS.primary,
              color: COLORS.white,
              padding: "3px 14px",
              borderRadius: RADIUS.pill,
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.5px"
            }}
          >
            MOST POPULAR
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: 0 }}>
                  Pro Business
                </h3>
                <span
                  style={{
                    background: "rgba(79, 70, 229, 0.1)",
                    color: COLORS.primary,
                    borderRadius: RADIUS.pill,
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "800"
                  }}
                >
                  PRO
                </span>
              </div>
              {activePlanId === "PRO" && (
                <span
                  style={{
                    background: COLORS.successBg,
                    color: COLORS.success,
                    borderRadius: RADIUS.pill,
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: "700"
                  }}
                >
                  Current Plan
                </span>
              )}
            </div>

            <p style={{ fontSize: "13px", color: COLORS.textSecondary, minHeight: "38px", margin: "0 0 16px" }}>
              Accelerate your local business reach with verified pro badge, priority ranking, and unlimited services.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: "800", color: COLORS.secondary }}>
                {billingCycle === "ANNUAL" ? "₹9,999" : "₹999"}
              </span>
              <span style={{ fontSize: "13px", color: COLORS.muted }}>
                {" "}
                / {billingCycle === "ANNUAL" ? "year" : "month"}
              </span>
              {billingCycle === "ANNUAL" && (
                <div style={{ fontSize: "12px", color: COLORS.success, fontWeight: "600", marginTop: "2px" }}>
                  Equivalent to ~₹833 / month
                </div>
              )}
            </div>

            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                paddingTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "28px"
              }}
            >
              {[
                "Verified 'PRO' Blue Badge on search & details",
                "Unlimited active services & custom durations",
                "Priority search placement above Starter listings",
                "Instant customer phone & email visibility",
                "Advanced booking & revenue growth analytics",
                "Priority email & WhatsApp customer support"
              ].map((feat) => (
                <div key={feat} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: COLORS.secondary }}>
                  <FaCheck color={COLORS.primary} size={12} style={{ marginTop: "3px", flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            disabled={activePlanId === "PRO"}
            onClick={() => handleOpenCheckout("PRO")}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {activePlanId === "PRO" ? "Current Active Plan" : "Upgrade to Pro"}
          </Button>
        </div>

        {/* Plan 3: Premium Elite */}
        <div
          style={{
            background: COLORS.surface,
            border: `2px solid ${activePlanId === "PREMIUM" ? "#D97706" : "#F59E0B"}`,
            borderRadius: RADIUS.medium,
            padding: "28px",
            boxShadow: SHADOWS.cardHover,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
        >
          {/* VIP Badge */}
          <div
            style={{
              position: "absolute",
              top: "-13px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
              color: COLORS.white,
              padding: "3px 14px",
              borderRadius: RADIUS.pill,
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.5px"
            }}
          >
            VIP ELITE PARTNER
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: 0 }}>
                  Premium Elite
                </h3>
                <span
                  style={{
                    background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                    color: "#B45309",
                    border: "1px solid #FCD34D",
                    borderRadius: RADIUS.pill,
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "800"
                  }}
                >
                  PREMIUM
                </span>
              </div>
              {activePlanId === "PREMIUM" && (
                <span
                  style={{
                    background: COLORS.successBg,
                    color: COLORS.success,
                    borderRadius: RADIUS.pill,
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: "700"
                  }}
                >
                  Current Plan
                </span>
              )}
            </div>

            <p style={{ fontSize: "13px", color: COLORS.textSecondary, minHeight: "38px", margin: "0 0 16px" }}>
              Maximum platform prominence with VIP top-spot algorithm boost, homepage showcase, and zero commission.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: "800", color: COLORS.secondary }}>
                {billingCycle === "ANNUAL" ? "₹19,999" : "₹1,999"}
              </span>
              <span style={{ fontSize: "13px", color: COLORS.muted }}>
                {" "}
                / {billingCycle === "ANNUAL" ? "year" : "month"}
              </span>
              {billingCycle === "ANNUAL" && (
                <div style={{ fontSize: "12px", color: COLORS.success, fontWeight: "600", marginTop: "2px" }}>
                  Equivalent to ~₹1,666 / month
                </div>
              )}
            </div>

            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                paddingTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "28px"
              }}
            >
              {[
                "Exclusive 'PREMIUM' Gold Crown Badge across platform",
                "Top-Spot #1 algorithm boost in all category searches",
                "Featured placement on Customer Homepage top banner",
                "Automated customer appointment SMS & WhatsApp alerts",
                "Zero commission on all appointments",
                "Dedicated Account Manager & 24/7 VIP Priority Hotline"
              ].map((feat) => (
                <div key={feat} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: COLORS.secondary }}>
                  <FaCrown color="#D97706" size={12} style={{ marginTop: "3px", flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            disabled={activePlanId === "PREMIUM"}
            onClick={() => handleOpenCheckout("PREMIUM")}
            style={{
              width: "100%",
              justifyContent: "center",
              background: activePlanId === "PREMIUM" ? undefined : "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
              borderColor: activePlanId === "PREMIUM" ? undefined : "#B45309"
            }}
          >
            {activePlanId === "PREMIUM" ? "Current Active Plan" : "Upgrade to Premium Elite"}
          </Button>
        </div>
      </div>

      {/* Payment & Billing History Section */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          padding: "24px",
          boxShadow: SHADOWS.card
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 4px" }}>
              Billing &amp; Payment History
            </h3>
            <p style={{ fontSize: "13px", color: COLORS.textSecondary, margin: 0 }}>
              Official tax invoices and transaction records for your business account.
            </p>
          </div>
        </div>

        {subscriptionData?.history?.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              background: COLORS.surfaceSubtle,
              borderRadius: RADIUS.small
            }}
          >
            <FaReceipt size={28} color={COLORS.muted} style={{ marginBottom: "10px" }} />
            <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: COLORS.secondary }}>
              No Billing History Found
            </h4>
            <p style={{ fontSize: "13px", color: COLORS.textSecondary, margin: 0 }}>
              You are currently on the Starter Free tier. Once you upgrade to Pro or Premium, your transaction invoices will be archived here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr
                  style={{
                    background: COLORS.surfaceSubtle,
                    borderBottom: `1px solid ${COLORS.border}`,
                    color: COLORS.muted,
                    fontSize: "12px",
                    fontWeight: "700",
                    textTransform: "uppercase"
                  }}
                >
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Transaction ID</th>
                  <th style={{ padding: "12px 16px" }}>Plan</th>
                  <th style={{ padding: "12px 16px" }}>Cycle</th>
                  <th style={{ padding: "12px 16px" }}>Method</th>
                  <th style={{ padding: "12px 16px" }}>Amount</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionData.history.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: idx % 2 === 0 ? COLORS.surface : COLORS.surfaceSubtle
                    }}
                  >
                    <td style={{ padding: "14px 16px", color: COLORS.secondary, whiteSpace: "nowrap" }}>
                      {formatPlanDate(item.createdAt || item.startDate)}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: "12px", color: COLORS.muted }}>
                      {item.transactionId}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: item.plan === "PREMIUM" ? "rgba(217, 119, 6, 0.12)" : "rgba(79, 70, 229, 0.1)",
                          color: item.plan === "PREMIUM" ? "#D97706" : COLORS.primary,
                          borderRadius: RADIUS.pill,
                          padding: "2px 8px",
                          fontSize: "11px",
                          fontWeight: "800"
                        }}
                      >
                        {item.plan}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: COLORS.textSecondary }}>
                      {item.billingCycle}
                    </td>
                    <td style={{ padding: "14px 16px", color: COLORS.secondary }}>
                      {item.paymentMethod}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: COLORS.secondary }}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: COLORS.successBg,
                          color: COLORS.success,
                          borderRadius: RADIUS.pill,
                          padding: "2px 8px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(item)}
                        style={{
                          background: "transparent",
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: RADIUS.xs,
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: COLORS.primary,
                          cursor: "pointer"
                        }}
                      >
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* CHECKOUT MODAL */}
      {/* ============================================================== */}
      {checkoutModal.isOpen && checkoutModal.plan && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 17, 35, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.modal,
              padding: isMobile ? "24px 18px" : "32px 28px",
              maxWidth: "520px",
              width: "100%",
              boxSizing: "border-box",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            {successReceipt ? (
              /* Success Confirmation Screen */
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: RADIUS.round,
                    background: COLORS.successBg,
                    color: COLORS.success,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    margin: "0 auto 16px"
                  }}
                >
                  <FaCheckCircle />
                </div>

                <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
                  Payment Successful!
                </h3>

                <p style={{ fontSize: "14px", color: COLORS.textSecondary, margin: "0 0 20px" }}>
                  Your business has been successfully upgraded to the{" "}
                  <strong>{checkoutModal.plan}</strong> plan. Verified badges and priority ranking are now live.
                </p>

                <div
                  style={{
                    background: COLORS.surfaceSubtle,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.small,
                    padding: "16px",
                    fontSize: "13px",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "24px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: COLORS.muted }}>Transaction ID:</span>
                    <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{successReceipt.transactionId}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: COLORS.muted }}>Amount Paid:</span>
                    <span style={{ fontWeight: "700", color: COLORS.primary }}>
                      {formatCurrency(successReceipt.amount)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: COLORS.muted }}>Plan Activated:</span>
                    <span style={{ fontWeight: "600" }}>
                      {checkoutModal.plan} ({billingCycle})
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: COLORS.muted }}>Valid Until:</span>
                    <span style={{ fontWeight: "600" }}>
                      {formatPlanDate(successReceipt.endDate)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => setCheckoutModal({ isOpen: false, plan: null })}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Return to Subscriptions
                </Button>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handlePaymentSubmit}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: RADIUS.round,
                        background: checkoutModal.plan === "PREMIUM" ? "rgba(217, 119, 6, 0.12)" : "rgba(79, 70, 229, 0.1)",
                        color: checkoutModal.plan === "PREMIUM" ? "#D97706" : COLORS.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px"
                      }}
                    >
                      {checkoutModal.plan === "PREMIUM" ? <FaCrown /> : <FaShieldAlt />}
                    </div>
                    <div>
                      <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: 0, fontSize: "17px" }}>
                        Upgrade to {checkoutModal.plan}
                      </h3>
                      <span style={{ fontSize: "12px", color: COLORS.muted }}>
                        {billingCycle === "ANNUAL" ? "Annual Billing (Save 17%)" : "Monthly Billing"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckoutModal({ isOpen: false, plan: null })}
                    style={{
                      border: "none",
                      background: COLORS.surfaceSubtle,
                      borderRadius: RADIUS.round,
                      width: "30px",
                      height: "30px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: COLORS.muted
                    }}
                  >
                    <FaTimes size={13} />
                  </button>
                </div>

                {/* Amount Summary */}
                <div
                  style={{
                    background: COLORS.surfaceSubtle,
                    borderRadius: RADIUS.small,
                    padding: "16px",
                    marginBottom: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "13px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.textSecondary }}>
                    <span>Plan Price:</span>
                    <span>
                      {checkoutModal.plan === "PREMIUM"
                        ? billingCycle === "ANNUAL"
                          ? "₹19,999"
                          : "₹1,999"
                        : billingCycle === "ANNUAL"
                        ? "₹9,999"
                        : "₹999"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.textSecondary }}>
                    <span>GST (Included 18%):</span>
                    <span>Included</span>
                  </div>
                  <div
                    style={{
                      borderTop: `1px solid ${COLORS.border}`,
                      paddingTop: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "800",
                      fontSize: "15px",
                      color: COLORS.secondary
                    }}
                  >
                    <span>Total Payable:</span>
                    <span style={{ color: COLORS.primary }}>
                      {checkoutModal.plan === "PREMIUM"
                        ? billingCycle === "ANNUAL"
                          ? "₹19,999"
                          : "₹1,999"
                        : billingCycle === "ANNUAL"
                        ? "₹9,999"
                        : "₹999"}
                    </span>
                  </div>
                </div>

                {/* Payment Method Tabs */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.secondary, display: "block", marginBottom: "8px" }}>
                    Select Payment Method:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {[
                      { id: "UPI", label: "UPI", icon: <FaMobileAlt /> },
                      { id: "CARD", label: "Card", icon: <FaCreditCard /> },
                      { id: "NETBANKING", label: "NetBanking", icon: <FaUniversity /> }
                    ].map((m) => {
                      const isSel = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          style={{
                            background: isSel ? "rgba(79, 70, 229, 0.08)" : COLORS.surface,
                            border: `2px solid ${isSel ? COLORS.primary : COLORS.border}`,
                            color: isSel ? COLORS.primary : COLORS.textSecondary,
                            borderRadius: RADIUS.small,
                            padding: "10px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Method Specific Fields */}
                {paymentMethod === "UPI" && (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: COLORS.secondary, display: "block", marginBottom: "6px" }}>
                      UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: RADIUS.xs,
                        fontSize: "13px",
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                    />
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                      {["@okhdfcbank", "@okaxis", "@paytm", "@ybl"].map((sfx) => (
                        <button
                          key={sfx}
                          type="button"
                          onClick={() => {
                            const prefix = upiId.split("@")[0] || "mybusiness";
                            setUpiId(`${prefix}${sfx}`);
                          }}
                          style={{
                            background: COLORS.surfaceSubtle,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: RADIUS.pill,
                            padding: "2px 8px",
                            fontSize: "11px",
                            color: COLORS.muted,
                            cursor: "pointer"
                          }}
                        >
                          {sfx}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === "CARD" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: COLORS.secondary, display: "block", marginBottom: "4px" }}>
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8899"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: RADIUS.xs,
                          fontSize: "13px",
                          boxSizing: "border-box",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: COLORS.secondary, display: "block", marginBottom: "4px" }}>
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: RADIUS.xs,
                            fontSize: "13px",
                            boxSizing: "border-box",
                            outline: "none"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: COLORS.secondary, display: "block", marginBottom: "4px" }}>
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: RADIUS.xs,
                            fontSize: "13px",
                            boxSizing: "border-box",
                            outline: "none"
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: COLORS.secondary, display: "block", marginBottom: "4px" }}>
                        Name on Card
                      </label>
                      <input
                        type="text"
                        placeholder="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: RADIUS.xs,
                          fontSize: "13px",
                          boxSizing: "border-box",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "NETBANKING" && (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: COLORS.secondary, display: "block", marginBottom: "6px" }}>
                      Choose Your Bank
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: RADIUS.xs,
                        fontSize: "13px",
                        boxSizing: "border-box",
                        outline: "none",
                        background: COLORS.surface
                      }}
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                    </select>
                  </div>
                )}

                {formError && (
                  <div
                    style={{
                      background: COLORS.dangerBg,
                      border: `1px solid ${COLORS.dangerBorder}`,
                      color: COLORS.danger,
                      padding: "8px 12px",
                      borderRadius: RADIUS.xs,
                      fontSize: "12px",
                      marginBottom: "16px"
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: COLORS.muted,
                    marginBottom: "20px",
                    justifyContent: "center"
                  }}
                >
                  <FaLock size={10} color={COLORS.success} />
                  <span>256-Bit SSL Encrypted &bull; Instant Plan Activation</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isProcessing}
                  style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                >
                  {isProcessing ? (
                    "Processing Payment..."
                  ) : (
                    `Pay ${
                      checkoutModal.plan === "PREMIUM"
                        ? billingCycle === "ANNUAL"
                          ? "₹19,999"
                          : "₹1,999"
                        : billingCycle === "ANNUAL"
                        ? "₹9,999"
                        : "₹999"
                    } & Activate Plan`
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CANCEL SUBSCRIPTION MODAL */}
      {/* ============================================================== */}
      {cancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 17, 35, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.modal,
              padding: "28px",
              maxWidth: "460px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
              Downgrade to Starter Free?
            </h3>
            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5", margin: "0 0 24px" }}>
              By downgrading, your business will lose its verified badge, priority search ranking, and be limited to 5 services.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                Keep My Plan
              </Button>
              <Button
                variant="primary"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                style={{ background: COLORS.danger, borderColor: COLORS.danger }}
              >
                {isCancelling ? "Processing..." : "Confirm Downgrade"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INVOICE MODAL */}
      {/* ============================================================== */}
      {viewingReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 17, 35, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.modal,
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 4px" }}>
                  Tax Invoice
                </h3>
                <span style={{ fontSize: "12px", color: COLORS.muted }}>APNA-BAZAR Technologies</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                style={{
                  border: "none",
                  background: COLORS.surfaceSubtle,
                  borderRadius: RADIUS.round,
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.muted
                }}
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div
              style={{
                background: COLORS.surfaceSubtle,
                borderRadius: RADIUS.small,
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "13px",
                marginBottom: "24px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Invoice Date:</span>
                <span style={{ fontWeight: "600" }}>{formatPlanDate(viewingReceipt.createdAt || viewingReceipt.startDate)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Transaction ID:</span>
                <span style={{ fontFamily: "monospace", fontSize: "12px" }}>{viewingReceipt.transactionId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Plan:</span>
                <span style={{ fontWeight: "700" }}>{viewingReceipt.plan} ({viewingReceipt.billingCycle})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Payment Method:</span>
                <span>{viewingReceipt.paymentMethod}</span>
              </div>
              <div
                style={{
                  borderTop: `1px solid ${COLORS.border}`,
                  paddingTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "15px",
                  fontWeight: "800",
                  color: COLORS.secondary
                }}
              >
                <span>Total Amount:</span>
                <span style={{ color: COLORS.primary }}>{formatCurrency(viewingReceipt.amount)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setViewingReceipt(null)}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Close Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessSubscription;
