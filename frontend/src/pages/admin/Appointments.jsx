import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaStore,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaRedoAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaTimes,
  FaCheck
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

// Pure date formatting helper
function formatDisplayDate(dateString) {
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

function AdminAppointments() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Data fetching state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filters & Search
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PENDING | CONFIRMED | COMPLETED | CANCELLED
  const [searchQuery, setSearchQuery] = useState("");

  // Inspection & Moderation Modal
  const [inspectModal, setInspectModal] = useState({
    isOpen: false,
    appointment: null
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Load appointments
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        const res = await adminService.getAllAppointments();
        const list = Array.isArray(res?.appointments)
          ? res.appointments
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        if (isMounted) {
          setAppointments(list);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err.customMessage ||
              err.message ||
              "Failed to load platform appointments."
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
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await adminService.getAllAppointments();
      const list = Array.isArray(res?.appointments)
        ? res.appointments
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setAppointments(list);
    } catch (err) {
      setLoadError(
        err.customMessage ||
          err.message ||
          "Failed to load platform appointments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Status Metrics
  const metrics = useMemo(() => {
    let total = appointments.length;
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;

    appointments.forEach((a) => {
      const s = (a.status || "").toUpperCase();
      if (s === "PENDING") pending++;
      else if (s === "CONFIRMED") confirmed++;
      else if (s === "COMPLETED") completed++;
      else if (s === "CANCELLED" || s === "REJECTED") cancelled++;
    });

    return { total, pending, confirmed, completed, cancelled };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        const s = (a.status || "").toUpperCase();
        if (activeTab === "ALL") return true;
        if (activeTab === "CANCELLED") return s === "CANCELLED" || s === "REJECTED";
        return s === activeTab;
      })
      .filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const custName = a.customerId?.name?.toLowerCase() || "";
        const custEmail = a.customerId?.email?.toLowerCase() || "";
        const bizName = a.businessId?.name?.toLowerCase() || "";
        const serviceName = a.serviceId?.name?.toLowerCase() || "";
        return (
          custName.includes(q) ||
          custEmail.includes(q) ||
          bizName.includes(q) ||
          serviceName.includes(q)
        );
      });
  }, [appointments, activeTab, searchQuery]);

  // Admin status update handler
  async function handleUpdateStatus(appointmentId, newStatus) {
    try {
      setIsUpdating(true);
      const res = await adminService.updateAppointmentStatus(appointmentId, newStatus);
      const updated = res?.appointment || res?.data;

      setAppointments((prev) =>
        prev.map((item) =>
          item._id === appointmentId
            ? { ...item, status: updated?.status || newStatus }
            : item
        )
      );

      if (inspectModal.isOpen && inspectModal.appointment?._id === appointmentId) {
        setInspectModal((prev) => ({
          ...prev,
          appointment: {
            ...prev.appointment,
            status: updated?.status || newStatus
          }
        }));
      }

      showToast(`Appointment status changed to ${newStatus}.`, "success");
    } catch (err) {
      showToast(
        err.customMessage || err.message || "Failed to update appointment status.",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // Render Status Badge
  function renderStatusBadge(status) {
    const s = (status || "").toUpperCase();
    let bg = "rgba(217, 119, 6, 0.12)";
    let color = "#D97706";
    let border = "rgba(217, 119, 6, 0.35)";
    let icon = <FaHourglassHalf size={11} />;

    if (s === "CONFIRMED") {
      bg = "rgba(79, 70, 229, 0.1)";
      color = COLORS.primary;
      border = "rgba(79, 70, 229, 0.3)";
      icon = <FaCheck size={11} />;
    } else if (s === "COMPLETED") {
      bg = COLORS.successBg;
      color = COLORS.success;
      border = COLORS.successBorder;
      icon = <FaCheckCircle size={11} />;
    } else if (s === "CANCELLED" || s === "REJECTED") {
      bg = COLORS.dangerBg;
      color = COLORS.danger;
      border = COLORS.dangerBorder;
      icon = <FaTimesCircle size={11} />;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: bg,
          color: color,
          border: `1px solid ${border}`,
          padding: "3px 10px",
          borderRadius: RADIUS.pill,
          fontSize: "12px",
          fontWeight: "700"
        }}
      >
        {icon}
        <span>{s || "PENDING"}</span>
      </span>
    );
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
        <Loader size="lg" message="Loading platform appointments..." />
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
          Unable to Load Appointments
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
        <Button variant="primary" onClick={fetchAppointments}>
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
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 99999,
            background: toast.type === "success" ? COLORS.secondary : COLORS.danger,
            color: COLORS.white,
            padding: "12px 20px",
            borderRadius: RADIUS.small,
            boxShadow: SHADOWS.cardHover,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "600"
          }}
        >
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{toast.message}</span>
        </div>
      )}

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
            All Appointments
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              margin: 0
            }}
          >
            Supervise, filter, and moderate customer bookings across all registered businesses.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchAppointments}
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
          <span>Refresh Bookings</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
            ? "repeat(2, 1fr)"
            : "repeat(5, 1fr)",
          gap: "14px",
          marginBottom: "28px"
        }}
      >
        {/* Metric 1: Total */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.muted, textTransform: "uppercase" }}>
            Total Bookings
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.secondary, marginTop: "4px" }}>
            {metrics.total}
          </div>
        </div>

        {/* Metric 2: Pending */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#D97706", textTransform: "uppercase" }}>
            Pending
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#D97706", marginTop: "4px" }}>
            {metrics.pending}
          </div>
        </div>

        {/* Metric 3: Confirmed */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.primary, textTransform: "uppercase" }}>
            Confirmed
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.primary, marginTop: "4px" }}>
            {metrics.confirmed}
          </div>
        </div>

        {/* Metric 4: Completed */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.success, textTransform: "uppercase" }}>
            Completed
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.success, marginTop: "4px" }}>
            {metrics.completed}
          </div>
        </div>

        {/* Metric 5: Cancelled */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.danger, textTransform: "uppercase" }}>
            Cancelled / Rejected
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.danger, marginTop: "4px" }}>
            {metrics.cancelled}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          padding: "18px 20px",
          boxShadow: SHADOWS.card,
          marginBottom: "24px",
          display: "flex",
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "stretch" : "center",
          justifyContent: "space-between",
          gap: "16px"
        }}
      >
        {/* Status Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: isMobile ? "4px" : "0"
          }}
        >
          {[
            { id: "ALL", label: "All", count: metrics.total },
            { id: "PENDING", label: "Pending", count: metrics.pending },
            { id: "CONFIRMED", label: "Confirmed", count: metrics.confirmed },
            { id: "COMPLETED", label: "Completed", count: metrics.completed },
            { id: "CANCELLED", label: "Cancelled", count: metrics.cancelled }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? COLORS.secondary : COLORS.surfaceSubtle,
                  color: isActive ? COLORS.white : COLORS.textSecondary,
                  border: `1px solid ${isActive ? COLORS.secondary : COLORS.border}`,
                  padding: "8px 14px",
                  borderRadius: RADIUS.pill,
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: TRANSITIONS.default
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: isActive
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(0, 0, 0, 0.08)",
                    color: isActive ? COLORS.white : COLORS.muted,
                    borderRadius: RADIUS.pill,
                    padding: "1px 7px",
                    fontSize: "11px",
                    fontWeight: "700"
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: COLORS.surfaceSubtle,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.small,
            padding: "8px 14px",
            minWidth: isCompact ? "100%" : "300px",
            boxSizing: "border-box"
          }}
        >
          <FaSearch size={14} color={COLORS.muted} style={{ marginRight: "10px", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search customer, business, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: COLORS.secondary,
              width: "100%"
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                border: "none",
                background: "transparent",
                color: COLORS.muted,
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center"
              }}
              title="Clear search"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Appointments List Content */}
      {filteredAppointments.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "60px 24px",
            textAlign: "center",
            boxShadow: SHADOWS.card
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: RADIUS.round,
              background: COLORS.surfaceSubtle,
              color: COLORS.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 16px"
            }}
          >
            <FaCalendarAlt />
          </div>
          <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
            No Appointments Found
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              maxWidth: "420px",
              margin: "0 auto 20px"
            }}
          >
            {searchQuery || activeTab !== "ALL"
              ? "No bookings match your current search query or status filter."
              : "Zero appointments have been booked across the platform."}
          </p>
          {(searchQuery || activeTab !== "ALL") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("ALL");
              }}
              style={{ fontSize: "13px" }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        /* Appointment Cards Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "18px"
          }}
        >
          {filteredAppointments.map((app) => (
            <div
              key={app._id}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.medium,
                padding: "20px",
                boxShadow: SHADOWS.card,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                {/* Header: Service + Status */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "12px"
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: "0 0 4px",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: COLORS.secondary
                      }}
                    >
                      {app.serviceId?.name || "Service Unavailable"}
                    </h3>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: COLORS.primary }}>
                      {formatCurrency(app.price || app.serviceId?.price || 0)}
                      {app.serviceId?.duration && (
                        <span style={{ fontSize: "12px", color: COLORS.muted, fontWeight: "500", marginLeft: "6px" }}>
                          ({app.serviceId.duration} mins)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>{renderStatusBadge(app.status)}</div>
                </div>

                {/* Date & Time pill */}
                <div
                  style={{
                    background: COLORS.surfaceSubtle,
                    borderRadius: RADIUS.small,
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    fontSize: "12px",
                    color: COLORS.secondary,
                    marginBottom: "14px",
                    fontWeight: "600"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FaCalendarAlt size={11} color={COLORS.muted} />
                    <span>{formatDisplayDate(app.date)}</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FaClock size={11} color={COLORS.muted} />
                    <span>{app.time || "N/A"}</span>
                  </span>
                </div>

                {/* Business Info */}
                <div
                  style={{
                    borderTop: `1px solid ${COLORS.border}`,
                    paddingTop: "12px",
                    marginBottom: "10px",
                    fontSize: "12px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.secondary, fontWeight: "600" }}>
                    <FaStore size={12} color={COLORS.primary} />
                    <span>{app.businessId?.name || "Business Deleted"}</span>
                    {app.businessId?.city && (
                      <span style={{ color: COLORS.muted, fontWeight: "400" }}>• {app.businessId.city}</span>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div
                  style={{
                    fontSize: "12px",
                    color: COLORS.textSecondary,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginBottom: "16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaUser size={11} color={COLORS.muted} />
                    <span style={{ fontWeight: "600", color: COLORS.secondary }}>
                      {app.customerId?.name || "Customer Account Deleted"}
                    </span>
                  </div>
                  {app.customerId?.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaEnvelope size={11} color={COLORS.muted} />
                      <span>{app.customerId.email}</span>
                    </div>
                  )}
                  {app.customerId?.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaPhone size={11} color={COLORS.muted} />
                      <span>{app.customerId.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderTop: `1px solid ${COLORS.border}`,
                  paddingTop: "14px"
                }}
              >
                <Button
                  variant="outline"
                  onClick={() => setInspectModal({ isOpen: true, appointment: app })}
                  style={{ flex: 1, fontSize: "12px", padding: "6px 10px", justifyContent: "center" }}
                >
                  Inspect
                </Button>

                {app.status === "PENDING" && (
                  <Button
                    variant="primary"
                    onClick={() => handleUpdateStatus(app._id, "CONFIRMED")}
                    disabled={isUpdating}
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    Confirm
                  </Button>
                )}

                {app.status !== "CANCELLED" && app.status !== "COMPLETED" && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(app._id, "CANCELLED")}
                    disabled={isUpdating}
                    style={{
                      fontSize: "12px",
                      padding: "6px 10px",
                      color: COLORS.danger,
                      borderColor: COLORS.dangerBorder
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Inspection Modal */}
      {inspectModal.isOpen && inspectModal.appointment && (
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
              boxSizing: "border-box"
            }}
          >
            {/* Modal Header */}
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
                  Appointment Details
                </h3>
                <span style={{ fontSize: "11px", color: COLORS.muted }}>
                  ID: {inspectModal.appointment._id}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setInspectModal({ isOpen: false, appointment: null })}
                style={{
                  border: "none",
                  background: COLORS.surfaceSubtle,
                  borderRadius: RADIUS.round,
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: COLORS.muted
                }}
                title="Close modal"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Details Box */}
            <div
              style={{
                background: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.small,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
                fontSize: "13px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: COLORS.muted, fontWeight: "600" }}>Status:</span>
                <span>{renderStatusBadge(inspectModal.appointment.status)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted, fontWeight: "600" }}>Service:</span>
                <span style={{ fontWeight: "700", color: COLORS.secondary }}>
                  {inspectModal.appointment.serviceId?.name || "Service Deleted"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted, fontWeight: "600" }}>Price:</span>
                <span style={{ fontWeight: "700", color: COLORS.primary }}>
                  {formatCurrency(inspectModal.appointment.price || 0)}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted, fontWeight: "600" }}>Booking Slot:</span>
                <span style={{ fontWeight: "600", color: COLORS.secondary }}>
                  {formatDisplayDate(inspectModal.appointment.date)} at {inspectModal.appointment.time}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted, fontWeight: "600" }}>Business:</span>
                <span style={{ fontWeight: "600", color: COLORS.secondary }}>
                  {inspectModal.appointment.businessId?.name || "N/A"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted, fontWeight: "600" }}>Customer:</span>
                <span style={{ fontWeight: "600", color: COLORS.secondary }}>
                  {inspectModal.appointment.customerId?.name || "N/A"}
                </span>
              </div>

              {inspectModal.appointment.notes && (
                <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.muted, marginBottom: "4px" }}>
                    Customer Notes:
                  </div>
                  <div style={{ fontStyle: "italic", color: COLORS.textSecondary }}>
                    &ldquo;{inspectModal.appointment.notes}&rdquo;
                  </div>
                </div>
              )}
            </div>

            {/* Quick Moderation Options */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: COLORS.secondary, marginBottom: "10px" }}>
                Moderation Actions:
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={isUpdating || inspectModal.appointment.status === st}
                    onClick={() => handleUpdateStatus(inspectModal.appointment._id, st)}
                    style={{
                      background: inspectModal.appointment.status === st ? COLORS.surfaceSubtle : COLORS.surface,
                      color:
                        st === "CONFIRMED"
                          ? COLORS.primary
                          : st === "COMPLETED"
                          ? COLORS.success
                          : COLORS.danger,
                      border: `1px solid ${COLORS.border}`,
                      padding: "6px 14px",
                      borderRadius: RADIUS.xs,
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: inspectModal.appointment.status === st ? "default" : "pointer",
                      opacity: inspectModal.appointment.status === st ? 0.5 : 1
                    }}
                  >
                    Set to {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outline"
                onClick={() => setInspectModal({ isOpen: false, appointment: null })}
                style={{ fontSize: "13px" }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppointments;
