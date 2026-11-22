import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaStore,
  FaCalendarCheck,
  FaUserCheck,
  FaUserTie,
  FaBan,
  FaHourglassHalf,
  FaCheckCircle,
  FaRedoAlt,
  FaArrowRight,
  FaExclamationTriangle,
  FaCreditCard,
  FaCrown,
  FaMoneyBillWave
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import adminService from "../../services/adminService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

function AdminDashboard() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        const res = await adminService.getDashboardMetrics();
        if (isMounted) {
          setMetrics(res?.dashboard || null);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err.customMessage ||
              err.message ||
              "Failed to load platform metrics."
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

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await adminService.getDashboardMetrics();
      setMetrics(res?.dashboard || null);
    } catch (err) {
      setLoadError(
        err.customMessage ||
          err.message ||
          "Failed to load platform metrics."
      );
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
        <Loader size="lg" message="Loading admin dashboard metrics..." />
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
        <h2
          style={{
            ...TYPOGRAPHY.h3,
            color: COLORS.secondary,
            margin: "0 0 10px"
          }}
        >
          Unable to Load Dashboard
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: COLORS.textSecondary,
            marginBottom: "20px"
          }}
        >
          {loadError}
        </p>
        <Button variant="primary" onClick={fetchMetrics}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const users = metrics?.users || { total: 0, customers: 0, businessOwners: 0 };
  const businesses = metrics?.businesses || { total: 0, active: 0, suspended: 0, blocked: 0 };
  const appointments = metrics?.appointments || { total: 0, pending: 0, completed: 0, cancelled: 0 };

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
          <h1
            style={{
              ...TYPOGRAPHY.h1,
              color: COLORS.secondary,
              margin: "0 0 6px"
            }}
          >
            Admin Dashboard
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              margin: 0
            }}
          >
            Real-time platform overview and administrative controls for APNA-BAZAR.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchMetrics}
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

      {/* Platform Financial & Revenue Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E293B 100%)",
          borderRadius: RADIUS.large,
          padding: isMobile ? "24px 20px" : "32px 36px",
          color: COLORS.white,
          boxShadow: SHADOWS.card,
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isCompact ? "column" : "row",
            alignItems: isCompact ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: "24px"
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(245, 158, 11, 0.2)",
                color: "#FCD34D",
                padding: "4px 12px",
                borderRadius: RADIUS.pill,
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "12px"
              }}
            >
              <FaMoneyBillWave size={12} />
              <span>Platform Revenue Engine</span>
            </div>

            <div style={{ fontSize: "13px", color: "#C7D2FE", fontWeight: "600", textTransform: "uppercase" }}>
              Total Platform Gross Volume
            </div>
            <div
              style={{
                fontSize: isMobile ? "36px" : "44px",
                fontWeight: "900",
                color: COLORS.white,
                letterSpacing: "-0.02em",
                margin: "4px 0 12px"
              }}
            >
              ₹{(metrics?.revenue?.totalRevenue || 0).toLocaleString("en-IN")}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", fontSize: "13px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#E0E7FF" }}>
                <FaCrown color="#F59E0B" size={13} />
                SaaS Subscription Revenue: <strong>₹{(metrics?.revenue?.subscriptionRevenue || 0).toLocaleString("en-IN")}</strong>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#E0E7FF" }}>
                <FaCheckCircle color="#34D399" size={13} />
                Booking GMV: <strong>₹{(metrics?.revenue?.bookingGMV || 0).toLocaleString("en-IN")}</strong>
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignSelf: isCompact ? "stretch" : "center"
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: RADIUS.medium,
                padding: "14px 20px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px"
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#A5B4FC", textTransform: "uppercase", fontWeight: "700" }}>
                  Active Paid Merchants
                </div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF" }}>
                  {metrics?.revenue?.activePaidSubscribers || 0} Stores
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span
                  style={{
                    background: "rgba(99, 102, 241, 0.3)",
                    color: "#C7D2FE",
                    padding: "3px 8px",
                    borderRadius: RADIUS.xs,
                    fontSize: "11px",
                    fontWeight: "700"
                  }}
                >
                  {metrics?.businesses?.pro || 0} Pro
                </span>
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.3)",
                    color: "#FDE68A",
                    padding: "3px 8px",
                    borderRadius: RADIUS.xs,
                    fontSize: "11px",
                    fontWeight: "700"
                  }}
                >
                  {metrics?.businesses?.premium || 0} Premium
                </span>
              </div>
            </div>

            <Link
              to="/admin/transactions"
              style={{
                textDecoration: "none",
                background: COLORS.white,
                color: COLORS.primaryDark,
                borderRadius: RADIUS.small,
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: SHADOWS.md
              }}
            >
              <FaCreditCard size={13} />
              <span>Open Transactions & Ledger →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
            ? "repeat(2, 1fr)"
            : "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "32px"
        }}
      >
        {/* Metric 1: Registered Accounts */}
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
              marginBottom: "16px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: RADIUS.round,
                background: "rgba(79, 70, 229, 0.1)",
                color: COLORS.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}
            >
              <FaUsers />
            </div>
            <Link
              to="/admin/users"
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: COLORS.primary,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>Manage</span>
              <FaArrowRight size={10} />
            </Link>
          </div>

          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Total Registered Users
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: COLORS.secondary,
              margin: "4px 0 16px"
            }}
          >
            {users.total}
          </div>

          <div
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: COLORS.textSecondary
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FaUserCheck color={COLORS.success} />
              <strong>{users.customers}</strong> Customers
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FaUserTie color={COLORS.primary} />
              <strong>{users.businessOwners}</strong> Owners
            </span>
          </div>
        </div>

        {/* Metric 2: Marketplace Businesses */}
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
              marginBottom: "16px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: RADIUS.round,
                background: COLORS.successBg,
                color: COLORS.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}
            >
              <FaStore />
            </div>
            <Link
              to="/admin/businesses"
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: COLORS.primary,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>Moderate</span>
              <FaArrowRight size={10} />
            </Link>
          </div>

          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Registered Businesses
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: COLORS.secondary,
              margin: "4px 0 16px"
            }}
          >
            {businesses.total}
          </div>

          <div
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: COLORS.textSecondary
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FaCheckCircle color={COLORS.success} />
              <strong>{businesses.active}</strong> Active
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FaBan color={COLORS.danger} />
              <strong>{businesses.suspended + businesses.blocked}</strong> Flagged
            </span>
          </div>
        </div>

        {/* Metric 3: Total Bookings */}
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
              marginBottom: "16px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: RADIUS.round,
                background: "rgba(217, 119, 6, 0.12)",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}
            >
              <FaCalendarCheck />
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: COLORS.muted,
                background: COLORS.surfaceSubtle,
                padding: "3px 8px",
                borderRadius: RADIUS.pill
              }}
            >
              System Total
            </span>
          </div>

          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Platform Appointments
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: COLORS.secondary,
              margin: "4px 0 16px"
            }}
          >
            {appointments.total}
          </div>

          <div
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: COLORS.textSecondary
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FaHourglassHalf color="#D97706" />
              <strong>{appointments.pending}</strong> Pending
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FaCheckCircle color={COLORS.success} />
              <strong>{appointments.completed}</strong> Completed
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <h2
        style={{
          ...TYPOGRAPHY.h3,
          color: COLORS.secondary,
          marginBottom: "16px"
        }}
      >
        Administration Hub
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "repeat(2, 1fr)",
          gap: "20px"
        }}
      >
        {/* User Directory Card */}
        <Link
          to="/admin/users"
          style={{
            textDecoration: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "24px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "flex-start",
            gap: "18px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.round,
              background: "rgba(79, 70, 229, 0.1)",
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            <FaUsers />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: COLORS.secondary
                }}
              >
                User Directory & Accounts
              </h3>
              <FaArrowRight size={13} color={COLORS.primary} />
            </div>
            <p
              style={{
                fontSize: "13px",
                color: COLORS.textSecondary,
                lineHeight: "1.5",
                margin: 0
              }}
            >
              View all customer, business owner, and admin accounts. Inspect IDs, emails,
              and registration timestamps.
            </p>
          </div>
        </Link>

        {/* Business Moderation Card */}
        <Link
          to="/admin/businesses"
          style={{
            textDecoration: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "24px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "flex-start",
            gap: "18px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.round,
              background: COLORS.successBg,
              color: COLORS.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            <FaStore />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: COLORS.secondary
                }}
              >
                Business Moderation & Status
              </h3>
              <FaArrowRight size={13} color={COLORS.primary} />
            </div>
            <p
              style={{
                fontSize: "13px",
                color: COLORS.textSecondary,
                lineHeight: "1.5",
                margin: 0
              }}
            >
              Moderate businesses across the platform. Activate approved listings, suspend
              non-compliant providers, or block violators.
            </p>
          </div>
        </Link>

        {/* Platform Subscriptions & Invoices Card */}
        <Link
          to="/admin/transactions"
          style={{
            textDecoration: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "24px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "flex-start",
            gap: "18px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.round,
              background: "rgba(217, 119, 6, 0.12)",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            <FaCreditCard />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: COLORS.secondary
                }}
              >
                Revenue &amp; Subscriptions
              </h3>
              <FaArrowRight size={13} color={COLORS.primary} />
            </div>
            <p
              style={{
                fontSize: "13px",
                color: COLORS.textSecondary,
                lineHeight: "1.5",
                margin: 0
              }}
            >
              Track merchant subscription upgrades, Pro/Premium payments, active plan counts,
              and tax invoices.
            </p>
          </div>
        </Link>
        {/* Platform Appointments Card */}
        <Link
          to="/admin/appointments"
          style={{
            textDecoration: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "24px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "flex-start",
            gap: "18px",
            transition: TRANSITIONS.default
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.round,
              background: "rgba(16, 185, 129, 0.12)",
              color: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            <FaCalendarCheck />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: COLORS.secondary
                }}
              >
                Platform Appointments
              </h3>
              <FaArrowRight size={13} color={COLORS.primary} />
            </div>
            <p
              style={{
                fontSize: "13px",
                color: COLORS.textSecondary,
                lineHeight: "1.5",
                margin: 0
              }}
            >
              Audit system bookings across all categories. Filter by pending, confirmed,
              completed, or cancelled statuses.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
