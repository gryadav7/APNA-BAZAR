import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaStore,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUser,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaShieldAlt,
  FaMoneyBillWave,
  FaStickyNote,
  FaCopy,
  FaCheck,
  FaPrint,
  FaRedoAlt,
  FaExclamationTriangle,
  FaInfoCircle
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  PAGE_WIDTH,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import appointmentService from "../../services/appointmentService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

function AppointmentDetails() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Data state
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  // Cancellation modal & reason state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Change of plans");
  const [customReason, setCustomReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Fetch appointment data
  useEffect(() => {
    let isMounted = true;

    async function fetchDetails() {
      if (!appointmentId) {
        setErrorMessage("Appointment ID is missing from URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        const res = await appointmentService.getAppointmentById(appointmentId);
        const data = res?.data || res?.appointment || res;

        if (isMounted) {
          if (!data || !data._id) {
            setErrorMessage("Appointment not found or was removed.");
            return;
          }
          setAppointment(data);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.customMessage ||
              err.message ||
              "Failed to load appointment details from server."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  // Helpers
  function formatPrice(amount) {
    if (typeof amount !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDuration(minutes) {
    if (!minutes) return "Standard duration";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} hr ${rem} mins` : `${hours} hr`;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return "N/A";
    const slice = dateStr.slice(0, 10);
    const [year, month, day] = slice.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return slice;
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function formatTimeDisplay(timeStr) {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    const minPad = String(m).padStart(2, "0");
    return `${hour12}:${minPad} ${ampm} (${timeStr})`;
  }

  function formatTimestamp(ts) {
    if (!ts) return "N/A";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Copy Reference ID
  async function handleCopyId() {
    if (!appointment?._id) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(appointment._id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      }
    } catch {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }

  // Print voucher
  function handlePrintReceipt() {
    window.print();
  }

  // Handle Cancellation
  async function handleCancelAppointment() {
    if (!appointment?._id) return;

    try {
      setIsCancelling(true);
      setCancelError("");
      const res = await appointmentService.cancelAppointment(appointment._id);
      const updated = res?.data || res?.appointment;

      setAppointment((prev) => ({
        ...prev,
        status: updated?.status || "CANCELLED"
      }));

      setShowCancelModal(false);
      setActionSuccess("Appointment has been cancelled successfully. Time slot released.");
    } catch (err) {
      if (err.status === 409) {
        setCancelError(
          "Appointment status has already changed on the server. Please refresh the page to view current status."
        );
      } else {
        setCancelError(
          err.customMessage ||
            err.message ||
            "Unable to cancel appointment at this time."
        );
      }
    } finally {
      setIsCancelling(false);
    }
  }

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
        <Loader size="lg" message="Loading appointment details..." />
      </div>
    );
  }

  if (errorMessage || !appointment) {
    return (
      <div
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isMobile ? "24px 16px 64px" : "40px 28px 80px",
          boxSizing: "border-box"
        }}
      >
        <Button
          variant="outline"
          size="sm"
          icon={<FaArrowLeft />}
          onClick={() => navigate("/my-appointments")}
          style={{ marginBottom: "24px" }}
        >
          Back to My Appointments
        </Button>

        <div
          style={{
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            borderRadius: RADIUS.medium,
            padding: "36px 24px",
            textAlign: "center",
            maxWidth: "600px",
            margin: "40px auto 0"
          }}
        >
          <FaExclamationTriangle
            size={36}
            color={COLORS.danger}
            style={{ marginBottom: "14px" }}
          />
          <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
            Appointment Unavailable
          </h2>
          <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "24px" }}>
            {errorMessage || "The requested appointment record does not exist or access was denied."}
          </p>
          <Link to="/my-appointments" style={{ textDecoration: "none" }}>
            <Button variant="primary">Return to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const biz = appointment.businessId || {};
  const srv = appointment.serviceId || {};
  const cust = appointment.customerId || {};
  const status = appointment.status || "PENDING";
  const displayRef = `#${appointment._id.slice(-8).toUpperCase()}`;
  const isCanCancel = status === "PENDING" || status === "CONFIRMED";

  // Stepper state determination
  const isTerminalCancelled = status === "CANCELLED" || status === "REJECTED";

  return (
    <div
      style={{
        maxWidth: PAGE_WIDTH,
        margin: "0 auto",
        padding: isMobile ? "20px 16px 64px" : "36px 28px 80px",
        boxSizing: "border-box"
      }}
    >
      {/* Top Header & Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px"
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/my-appointments")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: COLORS.muted,
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            padding: "6px 0",
            transition: `color ${TRANSITIONS.fast}`
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.muted)}
        >
          <FaArrowLeft size={13} />
          Back to My Appointments
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="outline"
            size="sm"
            icon={<FaPrint />}
            onClick={handlePrintReceipt}
          >
            Print Receipt
          </Button>

          {biz._id && (
            <Link
              to={`/book/${biz._id}${srv._id ? `?serviceId=${srv._id}` : ""}`}
              style={{ textDecoration: "none" }}
            >
              <Button variant="primary" size="sm" icon={<FaRedoAlt />}>
                Book Again
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div
          style={{
            background: COLORS.successBg,
            border: `1px solid ${COLORS.successBorder}`,
            color: COLORS.success,
            borderRadius: RADIUS.small,
            padding: "14px 18px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <FaCheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Card Header */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.card,
          padding: isMobile ? "24px 18px" : "32px 36px",
          marginBottom: "28px"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: "18px",
            paddingBottom: "22px",
            borderBottom: `1px solid ${COLORS.border}`
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "15px",
                  fontWeight: "800",
                  color: COLORS.primaryDark,
                  background: COLORS.primaryBg,
                  padding: "4px 12px",
                  borderRadius: RADIUS.xs
                }}
              >
                {displayRef}
              </span>

              <button
                type="button"
                onClick={handleCopyId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "transparent",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.xs,
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: copiedId ? COLORS.success : COLORS.muted,
                  cursor: "pointer"
                }}
              >
                {copiedId ? <FaCheck color={COLORS.success} /> : <FaCopy />}
                <span>{copiedId ? "Copied" : "Copy Full ID"}</span>
              </button>
            </div>

            <h1
              style={{
                ...TYPOGRAPHY.h2,
                color: COLORS.secondary,
                margin: "0 0 4px",
                fontSize: isMobile ? "22px" : "28px"
              }}
            >
              {srv.name || "Appointment Service"}
            </h1>

            <p style={{ margin: 0, fontSize: "14px", color: COLORS.muted }}>
              At <strong>{biz.name || "Business"}</strong> &bull; Booked on {formatTimestamp(appointment.createdAt)}
            </p>
          </div>

          {/* Status Badge */}
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background:
                  status === "PENDING"
                    ? COLORS.warningBg
                    : status === "CONFIRMED"
                    ? COLORS.lightBlue
                    : status === "COMPLETED"
                    ? COLORS.successBg
                    : COLORS.dangerBg,
                color:
                  status === "PENDING"
                    ? "#9A6200"
                    : status === "CONFIRMED"
                    ? COLORS.info
                    : status === "COMPLETED"
                    ? COLORS.success
                    : COLORS.danger,
                border: `1px solid ${
                  status === "PENDING"
                    ? COLORS.warningBorder
                    : status === "CONFIRMED"
                    ? COLORS.infoBorder
                    : status === "COMPLETED"
                    ? COLORS.successBorder
                    : COLORS.dangerBorder
                }`,
                padding: "8px 18px",
                borderRadius: RADIUS.pill,
                fontSize: "14px",
                fontWeight: "700"
              }}
            >
              {status === "PENDING" && <FaHourglassHalf />}
              {status === "CONFIRMED" && <FaCheckCircle />}
              {status === "COMPLETED" && <FaCheckCircle />}
              {status === "CANCELLED" && <FaTimesCircle />}
              {status === "REJECTED" && <FaTimesCircle />}
              <span>
                {status === "PENDING"
                  ? "Pending Confirmation"
                  : status === "CONFIRMED"
                  ? "Booking Confirmed"
                  : status === "COMPLETED"
                  ? "Service Completed"
                  : status === "CANCELLED"
                  ? "Booking Cancelled"
                  : "Request Declined"}
              </span>
            </span>
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "14px"
            }}
          >
            Booking Progress Status
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : isTerminalCancelled ? "1fr 1fr" : "1fr 1fr 1fr",
              gap: "12px"
            }}
          >
            {/* Step 1: Placed */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: COLORS.successBg,
                border: `1px solid ${COLORS.successBorder}`,
                borderRadius: RADIUS.small,
                padding: "12px 14px"
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: RADIUS.round,
                  background: COLORS.success,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  flexShrink: 0
                }}
              >
                <FaCheck />
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: COLORS.secondary, display: "block" }}>
                  1. Request Placed
                </strong>
                <span style={{ fontSize: "11px", color: COLORS.muted }}>
                  {formatTimestamp(appointment.createdAt)}
                </span>
              </div>
            </div>

            {/* Step 2: Merchant Confirmation or Cancelled */}
            {isTerminalCancelled ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: COLORS.dangerBg,
                  border: `1px solid ${COLORS.dangerBorder}`,
                  borderRadius: RADIUS.small,
                  padding: "12px 14px"
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: RADIUS.round,
                    background: COLORS.danger,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    flexShrink: 0
                  }}
                >
                  <FaTimesCircle />
                </div>
                <div>
                  <strong style={{ fontSize: "13px", color: COLORS.danger, display: "block" }}>
                    2. {status === "CANCELLED" ? "Cancelled by Customer" : "Declined by Merchant"}
                  </strong>
                  <span style={{ fontSize: "11px", color: COLORS.muted }}>
                    Updated {formatTimestamp(appointment.updatedAt)}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background:
                    status === "CONFIRMED" || status === "COMPLETED"
                      ? COLORS.successBg
                      : COLORS.warningBg,
                  border: `1px solid ${
                    status === "CONFIRMED" || status === "COMPLETED"
                      ? COLORS.successBorder
                      : COLORS.warningBorder
                  }`,
                  borderRadius: RADIUS.small,
                  padding: "12px 14px"
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: RADIUS.round,
                    background:
                      status === "CONFIRMED" || status === "COMPLETED"
                        ? COLORS.success
                        : COLORS.warning,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    flexShrink: 0
                  }}
                >
                  {status === "CONFIRMED" || status === "COMPLETED" ? (
                    <FaCheck />
                  ) : (
                    <FaHourglassHalf />
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: "13px", color: COLORS.secondary, display: "block" }}>
                    2. Merchant Review
                  </strong>
                  <span style={{ fontSize: "11px", color: COLORS.muted }}>
                    {status === "CONFIRMED" || status === "COMPLETED"
                      ? "Confirmed by provider"
                      : "Awaiting provider confirmation"}
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Fulfillment */}
            {!isTerminalCancelled && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background:
                    status === "COMPLETED" ? COLORS.successBg : COLORS.surfaceSubtle,
                  border: `1px solid ${
                    status === "COMPLETED" ? COLORS.successBorder : COLORS.border
                  }`,
                  borderRadius: RADIUS.small,
                  padding: "12px 14px"
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: RADIUS.round,
                    background:
                      status === "COMPLETED" ? COLORS.success : COLORS.mutedLight,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    flexShrink: 0
                  }}
                >
                  <FaCheck />
                </div>
                <div>
                  <strong style={{ fontSize: "13px", color: COLORS.secondary, display: "block" }}>
                    3. Service Fulfillment
                  </strong>
                  <span style={{ fontSize: "11px", color: COLORS.muted }}>
                    {status === "COMPLETED"
                      ? "Fulfilled & paid"
                      : "Pay at venue upon service"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Detail Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "1.6fr 1fr",
          gap: "28px",
          alignItems: "start"
        }}
      >
        {/* LEFT COLUMN: Service & Schedule Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card: Appointment Schedule */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: isMobile ? "20px 16px" : "26px 24px"
            }}
          >
            <h2
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaCalendarAlt color={COLORS.primary} />
              <span>Schedule & Timing</span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "16px"
              }}
            >
              <div
                style={{
                  background: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.small,
                  padding: "14px"
                }}
              >
                <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                  Appointment Date
                </span>
                <strong style={{ fontSize: "16px", color: COLORS.secondary, display: "block", marginTop: "4px" }}>
                  {formatDateDisplay(appointment.date)}
                </strong>
                <span style={{ fontSize: "12px", color: COLORS.muted, marginTop: "2px", display: "block" }}>
                  {appointment.date?.slice(0, 10)}
                </span>
              </div>

              <div
                style={{
                  background: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.small,
                  padding: "14px"
                }}
              >
                <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                  Time Slot
                </span>
                <strong style={{ fontSize: "16px", color: COLORS.secondary, display: "block", marginTop: "4px" }}>
                  {formatTimeDisplay(appointment.time)}
                </strong>
                <span style={{ fontSize: "12px", color: COLORS.muted, marginTop: "2px", display: "block" }}>
                  Estimated Duration: {formatDuration(srv.duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Service Specification */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: isMobile ? "20px 16px" : "26px 24px"
            }}
          >
            <h2
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaMoneyBillWave color={COLORS.primary} />
              <span>Service Specification</span>
            </h2>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: COLORS.secondary, margin: "0 0 6px" }}>
                {srv.name || "Service"}
              </h3>
              {srv.description && (
                <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.6", margin: "0 0 16px" }}>
                  {srv.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  paddingTop: "14px",
                  borderTop: `1px solid ${COLORS.border}`
                }}
              >
                <span style={{ fontSize: "13px", color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaClock color={COLORS.muted} size={12} />
                  {formatDuration(srv.duration)}
                </span>

                <span style={{ fontSize: "18px", fontWeight: "800", color: COLORS.primaryDark }}>
                  {formatPrice(appointment.price || srv.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Customer Notes & Instructions */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: isMobile ? "20px 16px" : "26px 24px"
            }}
          >
            <h2
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaStickyNote color={COLORS.primary} />
              <span>Customer Notes & Instructions</span>
            </h2>

            {appointment.notes ? (
              <div
                style={{
                  background: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.small,
                  padding: "14px 16px",
                  fontSize: "14px",
                  color: COLORS.textSecondary,
                  fontStyle: "italic",
                  lineHeight: "1.6"
                }}
              >
                &ldquo;{appointment.notes}&rdquo;
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: COLORS.muted }}>
                No special requests or instructions were noted for this appointment.
              </p>
            )}
          </div>

          {/* Card: Customer Account Info */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: isMobile ? "20px 16px" : "26px 24px"
            }}
          >
            <h2
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaUser color={COLORS.primary} />
              <span>Customer Account</span>
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", fontSize: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.secondary, fontWeight: "600" }}>
                <FaUser color={COLORS.muted} size={12} />
                <span>{cust.name || "Customer Account"}</span>
              </div>

              {cust.email && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.textSecondary }}>
                  <FaEnvelope color={COLORS.muted} size={12} />
                  <span>{cust.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Merchant Details, Cost Summary, Cancellation Policy */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card: Merchant Profile Card */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: "24px"
            }}
          >
            <h3
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 16px",
                paddingBottom: "12px",
                borderBottom: `1px solid ${COLORS.border}`,
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaStore color={COLORS.primary} />
              <span>Provider Details</span>
            </h3>

            <div style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "16px", color: COLORS.secondary, display: "block" }}>
                {biz.name || "Merchant"}
              </strong>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                  fontSize: "13px",
                  color: COLORS.textSecondary,
                  marginTop: "6px"
                }}
              >
                <FaMapMarkerAlt color={COLORS.primary} size={13} style={{ marginTop: "2px", flexShrink: 0 }} />
                <span>
                  {biz.address ? `${biz.address}, ${biz.city}` : "Address provided upon confirmation"}
                </span>
              </div>

              {biz.contactNumber && (
                <div style={{ marginTop: "8px" }}>
                  <a
                    href={`tel:${biz.contactNumber}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: COLORS.primary,
                      fontSize: "13px",
                      textDecoration: "none",
                      fontWeight: "600"
                    }}
                  >
                    <FaPhoneAlt size={11} /> {biz.contactNumber}
                  </a>
                </div>
              )}
            </div>

            {biz._id && (
              <Link to={`/business/${biz._id}`} style={{ textDecoration: "none" }}>
                <Button variant="outline" size="sm" style={{ width: "100%" }}>
                  View Full Merchant Profile
                </Button>
              </Link>
            )}
          </div>

          {/* Card: Financial Summary */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: "24px"
            }}
          >
            <h3
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 16px",
                paddingBottom: "12px",
                borderBottom: `1px solid ${COLORS.border}`
              }}
            >
              Price & Payment
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.textSecondary }}>
                <span>Service Charge</span>
                <span>{formatPrice(appointment.price || srv.price)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.textSecondary }}>
                <span>Booking / Platform Fee</span>
                <span style={{ color: COLORS.success, fontWeight: "600" }}>₹0 (Free)</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: `1px dashed ${COLORS.border}`,
                  fontSize: "17px",
                  fontWeight: "800",
                  color: COLORS.secondary
                }}
              >
                <span>Total Payable</span>
                <span style={{ color: COLORS.primaryDark }}>
                  {formatPrice(appointment.price || srv.price)}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "10px 12px",
                background: COLORS.surfaceSubtle,
                borderRadius: RADIUS.xs,
                fontSize: "12px",
                color: COLORS.muted,
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaShieldAlt color={COLORS.success} />
              <span>Pay directly to the provider upon completion.</span>
            </div>
          </div>

          {/* Action: Cancellation Policy Box */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: "24px"
            }}
          >
            <h3
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 12px"
              }}
            >
              Cancellation Policy
            </h3>

            <p
              style={{
                fontSize: "13px",
                color: COLORS.textSecondary,
                lineHeight: "1.5",
                margin: "0 0 18px"
              }}
            >
              Free cancellation is allowed while the appointment is in <strong>PENDING</strong> or{" "}
              <strong>CONFIRMED</strong> status. Once marked as completed, cancellations can no longer be processed.
            </p>

            {isCanCancel ? (
              <Button
                variant="danger"
                size="md"
                onClick={() => setShowCancelModal(true)}
                style={{ width: "100%" }}
              >
                Cancel Appointment
              </Button>
            ) : (
              <div
                style={{
                  background: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  padding: "10px 14px",
                  borderRadius: RADIUS.small,
                  fontSize: "12px",
                  color: COLORS.muted,
                  textAlign: "center"
                }}
              >
                {status === "COMPLETED"
                  ? "This appointment was completed and cannot be cancelled."
                  : "This appointment has already been cancelled or declined."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal (Day 12 Rules & Policy) */}
      {showCancelModal && (
        <div
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
              maxWidth: "500px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: RADIUS.round,
                background: COLORS.dangerBg,
                color: COLORS.danger,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "16px"
              }}
            >
              <FaTimesCircle />
            </div>

            <h3
              style={{
                ...TYPOGRAPHY.h3,
                color: COLORS.secondary,
                margin: "0 0 8px"
              }}
            >
              Confirm Appointment Cancellation
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: COLORS.textSecondary,
                lineHeight: "1.5",
                margin: "0 0 16px"
              }}
            >
              You are cancelling your booking for <strong>{srv.name}</strong> on{" "}
              <strong>{formatDateDisplay(appointment.date)}</strong> at{" "}
              <strong>{formatTimeDisplay(appointment.time)}</strong> with{" "}
              <strong>{biz.name}</strong>.
            </p>

            {/* Conflict / Server Error Display */}
            {cancelError && (
              <div
                style={{
                  background: COLORS.dangerBg,
                  border: `1px solid ${COLORS.dangerBorder}`,
                  color: COLORS.danger,
                  borderRadius: RADIUS.small,
                  padding: "10px 14px",
                  fontSize: "13px",
                  marginBottom: "16px"
                }}
              >
                {cancelError}
              </div>
            )}

            {/* Cancellation Reason Selector */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="cancel-reason-select"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: COLORS.secondary,
                  marginBottom: "6px"
                }}
              >
                Reason for Cancellation (Optional)
              </label>
              <select
                id="cancel-reason-select"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: RADIUS.small,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "14px",
                  color: COLORS.text,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Need to reschedule for another date">Need to reschedule for another date</option>
                <option value="Found alternative service">Found alternative service</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Other">Other reason</option>
              </select>

              {cancelReason === "Other" && (
                <input
                  type="text"
                  placeholder="Specify reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    marginTop: "8px",
                    borderRadius: RADIUS.small,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    outline: "none"
                  }}
                />
              )}
            </div>

            <div
              style={{
                background: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                padding: "10px 14px",
                borderRadius: RADIUS.xs,
                fontSize: "12px",
                color: COLORS.muted,
                marginBottom: "24px"
              }}
            >
              <FaInfoCircle style={{ marginRight: "6px" }} />
              Once cancelled, this slot will be released and you will need to re-book if you change your mind.
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelError("");
                }}
                disabled={isCancelling}
              >
                Keep Appointment
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleCancelAppointment}
                loading={isCancelling}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentDetails;
