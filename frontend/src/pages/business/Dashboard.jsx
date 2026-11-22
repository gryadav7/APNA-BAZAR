import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaStore,
  FaCalendarCheck,
  FaHourglassHalf,
  FaCheckCircle,
  FaBriefcase,
  FaUsers,
  FaArrowRight,
  FaRedoAlt,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import businessService from "../../services/businessService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

// Pure date formatting helper
function formatSlotDate(dateString) {
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

function BusinessDashboard() {
  const { isMobile, isTablet } = useResponsive();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasNoBusiness, setHasNoBusiness] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        setHasNoBusiness(false);
        const res = await businessService.getDashboard();
        if (isMounted) {
          setDashboard(res?.dashboard || null);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 404 || err.message?.includes("not found")) {
            setHasNoBusiness(true);
          } else {
            setLoadError(
              err.customMessage ||
                err.message ||
                "Failed to load business dashboard."
            );
          }
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

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      setHasNoBusiness(false);
      const res = await businessService.getDashboard();
      setDashboard(res?.dashboard || null);
    } catch (err) {
      if (err.response?.status === 404 || err.message?.includes("not found")) {
        setHasNoBusiness(true);
      } else {
        setLoadError(
          err.customMessage ||
            err.message ||
            "Failed to load business dashboard."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
        <Loader size="lg" message="Loading your business dashboard..." />
      </div>
    );
  }

  // State: Business not created yet
  if (hasNoBusiness) {
    return (
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          padding: "50px 24px",
          textAlign: "center",
          maxWidth: "600px",
          margin: "40px auto",
          boxShadow: SHADOWS.card
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: RADIUS.round,
            background: "rgba(79, 70, 229, 0.1)",
            color: COLORS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            margin: "0 auto 18px"
          }}
        >
          <FaStore />
        </div>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.secondary, margin: "0 0 10px" }}>
          Welcome to APNA-BAZAR
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: COLORS.textSecondary,
            maxWidth: "460px",
            margin: "0 auto 24px",
            lineHeight: "1.5"
          }}
        >
          You haven&rsquo;t set up a business profile yet. Complete your business information,
          add services, and set your weekly schedule to start accepting customer appointments.
        </p>
        <Link to="/business/manage" style={{ textDecoration: "none" }}>
          <Button
            variant="primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px"
            }}
          >
            <FaPlus size={12} />
            <span>Set Up My Business</span>
          </Button>
        </Link>
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
        <FaExclamationTriangle
          size={36}
          color={COLORS.danger}
          style={{ marginBottom: "14px" }}
        />
        <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
          Unable to Load Dashboard
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={fetchDashboard}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const biz = dashboard?.business || {};
  const appointments = dashboard?.appointments || {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  };
  const services = dashboard?.services || { total: 0, active: 0 };
  const recent = Array.isArray(dashboard?.recentAppointments)
    ? dashboard.recentAppointments
    : [];

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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ ...TYPOGRAPHY.h1, color: COLORS.secondary, margin: 0 }}>
              {biz.name || "Business Dashboard"}
            </h1>
            {biz.category && (
              <span
                style={{
                  background: "rgba(79, 70, 229, 0.1)",
                  color: COLORS.primary,
                  padding: "3px 10px",
                  borderRadius: RADIUS.pill,
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                {biz.category}
              </span>
            )}

            {biz.subscriptionTier && biz.subscriptionTier !== "FREE" ? (
              <span
                style={{
                  background:
                    biz.subscriptionTier === "PREMIUM"
                      ? "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
                      : "rgba(79, 70, 229, 0.1)",
                  color: biz.subscriptionTier === "PREMIUM" ? "#B45309" : COLORS.primary,
                  border: `1px solid ${
                    biz.subscriptionTier === "PREMIUM" ? "#FCD34D" : "rgba(79, 70, 229, 0.3)"
                  }`,
                  padding: "3px 10px",
                  borderRadius: RADIUS.pill,
                  fontSize: "12px",
                  fontWeight: "800"
                }}
              >
                {biz.subscriptionTier} PLAN
              </span>
            ) : (
              <Link
                to="/business/subscription"
                style={{
                  textDecoration: "none",
                  background: "rgba(217, 119, 6, 0.12)",
                  color: "#D97706",
                  border: "1px solid rgba(217, 119, 6, 0.3)",
                  padding: "3px 10px",
                  borderRadius: RADIUS.pill,
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                ★ Upgrade to Pro
              </Link>
            )}
          </div>
          <p style={{ fontSize: "14px", color: COLORS.textSecondary, margin: 0 }}>
            {biz.city ? `${biz.city} • ` : ""}Welcome to your business management console.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchDashboard}
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
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Primary KPI Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
            ? "repeat(2, 1fr)"
            : "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "30px"
        }}
      >
        {/* Metric 1: Total Appointments */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: RADIUS.round,
                background: "rgba(79, 70, 229, 0.1)",
                color: COLORS.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}
            >
              <FaCalendarCheck />
            </div>
            <Link
              to="/business/appointments"
              style={{
                fontSize: "12px",
                color: COLORS.primary,
                textDecoration: "none",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>View All</span>
              <FaArrowRight size={10} />
            </Link>
          </div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.muted, textTransform: "uppercase" }}>
            Total Bookings
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
            {appointments.total}
          </div>
        </div>

        {/* Metric 2: Pending Confirmation */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: RADIUS.round,
                background: "rgba(217, 119, 6, 0.12)",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}
            >
              <FaHourglassHalf />
            </div>
            {appointments.pending > 0 && (
              <span
                style={{
                  background: "rgba(217, 119, 6, 0.15)",
                  color: "#D97706",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: RADIUS.pill
                }}
              >
                Action Needed
              </span>
            )}
          </div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#D97706", textTransform: "uppercase" }}>
            Pending Confirmation
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#D97706", marginTop: "2px" }}>
            {appointments.pending}
          </div>
        </div>

        {/* Metric 3: Confirmed & Completed */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: RADIUS.round,
                background: COLORS.successBg,
                color: COLORS.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}
            >
              <FaCheckCircle />
            </div>
            <span style={{ fontSize: "12px", color: COLORS.muted }}>
              {appointments.confirmed} Confirmed
            </span>
          </div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.success, textTransform: "uppercase" }}>
            Completed Bookings
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.success, marginTop: "2px" }}>
            {appointments.completed}
          </div>
        </div>

        {/* Metric 4: Active Services */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: RADIUS.round,
                background: "rgba(79, 70, 229, 0.1)",
                color: COLORS.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}
            >
              <FaBriefcase />
            </div>
            <Link
              to="/business/services"
              style={{
                fontSize: "12px",
                color: COLORS.primary,
                textDecoration: "none",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>Manage</span>
              <FaArrowRight size={10} />
            </Link>
          </div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.muted, textTransform: "uppercase" }}>
            Active Services
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
            {services.active}
            <span style={{ fontSize: "14px", color: COLORS.muted, fontWeight: "500", marginLeft: "6px" }}>
              / {services.total} total
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, marginBottom: "16px" }}>
        Quick Management
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px"
        }}
      >
        <Link
          to="/business/services"
          style={{
            textDecoration: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: RADIUS.round,
              background: "rgba(79, 70, 229, 0.1)",
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0
            }}
          >
            <FaBriefcase />
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: COLORS.secondary }}>
              Manage Services
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: COLORS.textSecondary }}>
              Add, edit, or adjust service prices & durations
            </p>
          </div>
        </Link>

        <Link
          to="/business/availability"
          style={{
            textDecoration: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: RADIUS.round,
              background: COLORS.successBg,
              color: COLORS.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0
            }}
          >
            <FaCalendarAlt />
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: COLORS.secondary }}>
              Weekly Availability
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: COLORS.textSecondary }}>
              Set operating days, working hours & slots
            </p>
          </div>
        </Link>

        <Link
          to="/business/customers"
          style={{
            textDecoration: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: RADIUS.round,
              background: "rgba(217, 119, 6, 0.12)",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0
            }}
          >
            <FaUsers />
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: COLORS.secondary }}>
              Customer Directory
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: COLORS.textSecondary }}>
              Review contact records & booking counts
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Bookings Section */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          padding: "24px",
          boxShadow: SHADOWS.card
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px"
          }}
        >
          <div>
            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 4px" }}>
              Recent Bookings
            </h3>
            <p style={{ fontSize: "13px", color: COLORS.textSecondary, margin: 0 }}>
              Latest appointments requested by customers.
            </p>
          </div>

          <Link
            to="/business/appointments"
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: COLORS.primary,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span>All Bookings</span>
            <FaArrowRight size={11} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              background: COLORS.surfaceSubtle,
              borderRadius: RADIUS.small
            }}
          >
            <FaCalendarCheck size={28} color={COLORS.muted} style={{ marginBottom: "10px" }} />
            <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: COLORS.secondary }}>
              No Recent Appointments
            </h4>
            <p style={{ fontSize: "13px", color: COLORS.textSecondary, margin: 0 }}>
              When customers book appointments with your business, they will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recent.map((app) => (
              <div
                key={app._id}
                style={{
                  background: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.small,
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: COLORS.secondary, marginBottom: "4px" }}>
                    {app.serviceId?.name || "Service"}
                  </div>
                  <div style={{ fontSize: "12px", color: COLORS.textSecondary, display: "flex", gap: "12px" }}>
                    <span>Customer: {app.customerId?.name || "Customer"}</span>
                    <span>•</span>
                    <span>{formatCurrency(app.serviceId?.price || 0)}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    alignSelf: isMobile ? "flex-end" : "center"
                  }}
                >
                  <div style={{ fontSize: "12px", color: COLORS.muted, display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaClock size={11} />
                    <span>{formatSlotDate(app.date)} at {app.time}</span>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: RADIUS.pill,
                      background:
                        app.status === "CONFIRMED"
                          ? "rgba(79, 70, 229, 0.1)"
                          : app.status === "COMPLETED"
                          ? COLORS.successBg
                          : "rgba(217, 119, 6, 0.12)",
                      color:
                        app.status === "CONFIRMED"
                          ? COLORS.primary
                          : app.status === "COMPLETED"
                          ? COLORS.success
                          : "#D97706"
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessDashboard;
