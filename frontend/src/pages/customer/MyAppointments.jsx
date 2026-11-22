import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaStore,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaSearch,
  FaRedoAlt,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaStickyNote,
  FaCheck
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
import useAuth from "../../hooks/useAuth";
import appointmentService from "../../services/appointmentService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function isAppointmentUpcoming(dateStr, today) {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) >= today;
}

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
    weekday: "short",
    year: "numeric",
    month: "short",
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

function formatCreatedDate(createdStr) {
  if (!createdStr) return "Recently";
  const d = new Date(createdStr);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function MyAppointments() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  const [todayStr] = useState(getTodayString);

  // Data fetching state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Filter & Search state
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("created_desc");

  // Cancellation state
  const [cancelModal, setCancelModal] = useState({ isOpen: false, appointment: null });
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionNotice, setActionNotice] = useState(null); // { type: 'success' | 'error', message: string }

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setErrorMessage("");
        const res = await appointmentService.getMyAppointments();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.appointments)
          ? res.appointments
          : Array.isArray(res)
          ? res
          : [];
        if (isMounted) {
          setAppointments(list);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.customMessage ||
              err.message ||
              "Failed to load your appointments. Please try again."
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

  // Manual retry handler
  async function handleRetry() {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await appointmentService.getMyAppointments();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.appointments)
        ? res.appointments
        : Array.isArray(res)
        ? res
        : [];
      setAppointments(list);
    } catch (err) {
      setErrorMessage(
        err.customMessage ||
          err.message ||
          "Failed to load your appointments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Handle Cancel Execution
  async function handleConfirmCancel() {
    if (!cancelModal.appointment?._id) return;

    try {
      setIsCancelling(true);
      const apptId = cancelModal.appointment._id;
      const res = await appointmentService.cancelAppointment(apptId);
      const updated = res?.data || res?.appointment;

      // Update state locally
      setAppointments((prev) =>
        prev.map((item) =>
          item._id === apptId
            ? { ...item, status: updated?.status || "CANCELLED" }
            : item
        )
      );

      setCancelModal({ isOpen: false, appointment: null });
      setActionNotice({
        type: "success",
        message: "Appointment was cancelled successfully."
      });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      setActionNotice({
        type: "error",
        message:
          err.customMessage ||
          err.message ||
          "Could not cancel appointment. It may have already been confirmed or completed."
      });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setIsCancelling(false);
    }
  }

  // Status Counts
  const counts = useMemo(() => {
    let all = appointments.length;
    let upcoming = 0;
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;

    appointments.forEach((item) => {
      const status = item.status;
      if (status === "PENDING") pending++;
      if (status === "CONFIRMED") confirmed++;
      if (status === "COMPLETED") completed++;
      if (status === "CANCELLED" || status === "REJECTED") cancelled++;

      if (
        (status === "PENDING" || status === "CONFIRMED") &&
        isAppointmentUpcoming(item.date, todayStr)
      ) {
        upcoming++;
      }
    });

    return { all, upcoming, pending, confirmed, completed, cancelled };
  }, [appointments, todayStr]);

  // Filtered & Sorted Appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((item) => {
        // Tab Filter
        if (activeTab === "UPCOMING") {
          const isPendingOrConfirmed =
            item.status === "PENDING" || item.status === "CONFIRMED";
          return isPendingOrConfirmed && isAppointmentUpcoming(item.date, todayStr);
        }
        if (activeTab === "PENDING") return item.status === "PENDING";
        if (activeTab === "CONFIRMED") return item.status === "CONFIRMED";
        if (activeTab === "COMPLETED") return item.status === "COMPLETED";
        if (activeTab === "CANCELLED") {
          return item.status === "CANCELLED" || item.status === "REJECTED";
        }
        return true;
      })
      .filter((item) => {
        // Search Query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const bizName = item.businessId?.name?.toLowerCase() || "";
        const srvName = item.serviceId?.name?.toLowerCase() || "";
        const city = item.businessId?.city?.toLowerCase() || "";
        return bizName.includes(q) || srvName.includes(q) || city.includes(q);
      })
      .sort((a, b) => {
        if (sortOrder === "date_asc") {
          const dateA = a.date ? a.date.slice(0, 10) : "";
          const dateB = b.date ? b.date.slice(0, 10) : "";
          return dateA.localeCompare(dateB);
        }
        if (sortOrder === "date_desc") {
          const dateA = a.date ? a.date.slice(0, 10) : "";
          const dateB = b.date ? b.date.slice(0, 10) : "";
          return dateB.localeCompare(dateA);
        }
        // created_desc default
        const createdA = new Date(a.createdAt || 0).getTime();
        const createdB = new Date(b.createdAt || 0).getTime();
        return createdB - createdA;
      });
  }, [appointments, activeTab, searchQuery, sortOrder, todayStr]);

  // Status Badge Component
  function renderStatusBadge(status) {
    let bg = COLORS.surfaceSubtle;
    let color = COLORS.textSecondary;
    let border = COLORS.border;
    let icon = <FaHourglassHalf size={11} />;
    let label = status || "PENDING";

    switch (status) {
      case "PENDING":
        bg = COLORS.warningBg;
        color = "#9A6200";
        border = COLORS.warningBorder;
        icon = <FaHourglassHalf size={11} />;
        label = "Pending Confirmation";
        break;
      case "CONFIRMED":
        bg = COLORS.lightBlue;
        color = COLORS.info;
        border = COLORS.infoBorder;
        icon = <FaCheckCircle size={11} />;
        label = "Confirmed";
        break;
      case "COMPLETED":
        bg = COLORS.successBg;
        color = COLORS.success;
        border = COLORS.successBorder;
        icon = <FaCheck size={11} />;
        label = "Completed";
        break;
      case "CANCELLED":
        bg = COLORS.dangerBg;
        color = COLORS.danger;
        border = COLORS.dangerBorder;
        icon = <FaTimesCircle size={11} />;
        label = "Cancelled";
        break;
      case "REJECTED":
        bg = COLORS.dangerBg;
        color = COLORS.danger;
        border = COLORS.dangerBorder;
        icon = <FaTimesCircle size={11} />;
        label = "Declined";
        break;
      default:
        break;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: bg,
          color: color,
          border: `1px solid ${border}`,
          padding: "4px 10px",
          borderRadius: RADIUS.pill,
          fontSize: "12px",
          fontWeight: "700"
        }}
      >
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div
      style={{
        maxWidth: PAGE_WIDTH,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 64px" : "40px 28px 80px",
        boxSizing: "border-box"
      }}
    >
      {/* Page Header */}
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
              ...TYPOGRAPHY.h2,
              color: COLORS.secondary,
              margin: "0 0 6px",
              fontSize: isMobile ? "26px" : "32px"
            }}
          >
            My Appointments
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: COLORS.muted }}>
            Review your upcoming bookings, schedule history, and service details.
          </p>
        </div>

        <Link to="/explore" style={{ textDecoration: "none" }}>
          <Button variant="primary" icon={<FaStore />}>
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          style={{
            background:
              actionNotice.type === "success" ? COLORS.successBg : COLORS.dangerBg,
            border: `1px solid ${
              actionNotice.type === "success"
                ? COLORS.successBorder
                : COLORS.dangerBorder
            }`,
            color:
              actionNotice.type === "success" ? COLORS.success : COLORS.danger,
            borderRadius: RADIUS.small,
            padding: "12px 18px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          {actionNotice.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr 1fr"
            : "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px"
        }}
      >
        {/* Total */}
        <div
          onClick={() => setActiveTab("ALL")}
          style={{
            background: activeTab === "ALL" ? COLORS.primaryBg : COLORS.surface,
            border: `1px solid ${activeTab === "ALL" ? COLORS.primary : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <div style={{ fontSize: "12px", color: COLORS.muted, fontWeight: "600", textTransform: "uppercase" }}>
            Total Bookings
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "4px" }}>
            {counts.all}
          </div>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => setActiveTab("UPCOMING")}
          style={{
            background: activeTab === "UPCOMING" ? COLORS.lightBlue : COLORS.surface,
            border: `1px solid ${activeTab === "UPCOMING" ? COLORS.info : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <div style={{ fontSize: "12px", color: COLORS.info, fontWeight: "600", textTransform: "uppercase" }}>
            Upcoming
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.info, marginTop: "4px" }}>
            {counts.upcoming}
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setActiveTab("PENDING")}
          style={{
            background: activeTab === "PENDING" ? COLORS.warningBg : COLORS.surface,
            border: `1px solid ${activeTab === "PENDING" ? COLORS.warningBorder : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <div style={{ fontSize: "12px", color: "#9A6200", fontWeight: "600", textTransform: "uppercase" }}>
            Pending Review
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#9A6200", marginTop: "4px" }}>
            {counts.pending}
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab("COMPLETED")}
          style={{
            background: activeTab === "COMPLETED" ? COLORS.successBg : COLORS.surface,
            border: `1px solid ${activeTab === "COMPLETED" ? COLORS.successBorder : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <div style={{ fontSize: "12px", color: COLORS.success, fontWeight: "600", textTransform: "uppercase" }}>
            Completed
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.success, marginTop: "4px" }}>
            {counts.completed}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar Row */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          boxShadow: SHADOWS.card,
          padding: "16px 20px",
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
            { id: "ALL", label: "All", count: counts.all },
            { id: "UPCOMING", label: "Upcoming", count: counts.upcoming },
            { id: "PENDING", label: "Pending", count: counts.pending },
            { id: "CONFIRMED", label: "Confirmed", count: counts.confirmed },
            { id: "COMPLETED", label: "Completed", count: counts.completed },
            { id: "CANCELLED", label: "Cancelled", count: counts.cancelled }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: RADIUS.pill,
                  border: `1px solid ${isActive ? COLORS.primary : "transparent"}`,
                  background: isActive ? COLORS.primaryBg : "transparent",
                  color: isActive ? COLORS.primaryDark : COLORS.textSecondary,
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: `all ${TRANSITIONS.fast}`
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: isActive ? COLORS.primary : COLORS.border,
                    color: isActive ? "#FFFFFF" : COLORS.textSecondary,
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 6px",
                    borderRadius: RADIUS.pill
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Sort */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: COLORS.surfaceSubtle,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.small,
              padding: "7px 12px",
              flex: isMobile ? "1 1 100%" : "0 0 200px"
            }}
          >
            <FaSearch color={COLORS.muted} size={12} />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "13px",
                color: COLORS.text,
                width: "100%",
                fontFamily: "inherit"
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              background: COLORS.surfaceSubtle,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.small,
              padding: "7px 12px",
              fontSize: "13px",
              color: COLORS.textSecondary,
              fontFamily: "inherit",
              outline: "none",
              cursor: "pointer",
              flex: isMobile ? "1 1 100%" : "auto"
            }}
          >
            <option value="created_desc">Booking Date (Newest)</option>
            <option value="date_asc">Schedule Date (Soonest)</option>
            <option value="date_desc">Schedule Date (Latest)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            minHeight: "40vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Loader size="lg" message="Loading your appointments..." />
        </div>
      ) : errorMessage ? (
        <div
          style={{
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            borderRadius: RADIUS.medium,
            padding: "36px 24px",
            textAlign: "center",
            maxWidth: "600px",
            margin: "32px auto"
          }}
        >
          <FaExclamationTriangle size={32} color={COLORS.danger} style={{ marginBottom: "12px" }} />
          <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
            Unable to Load Appointments
          </h2>
          <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
            {errorMessage}
          </p>
          <Button variant="primary" onClick={handleRetry} icon={<FaRedoAlt />}>
            Retry
          </Button>
        </div>
      ) : filteredAppointments.length === 0 ? (
        // Empty State
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "40px 20px" : "64px 32px",
            textAlign: "center",
            maxWidth: "640px",
            margin: "24px auto"
          }}
        >
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: RADIUS.round,
              background: COLORS.primaryBg,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 18px"
            }}
          >
            <FaCalendarAlt />
          </div>

          <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
            {appointments.length === 0
              ? "No Appointments Booked Yet"
              : "No Appointments Match This Filter"}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              lineHeight: "1.6",
              maxWidth: "460px",
              margin: "0 auto 24px"
            }}
          >
            {appointments.length === 0
              ? `Welcome ${user?.name || ""}! Discover verified local merchants and schedule professional services with zero hassle.`
              : `There are no appointments found for "${activeTab.toLowerCase()}" status or your current search query.`}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            {appointments.length === 0 ? (
              <Link to="/explore" style={{ textDecoration: "none" }}>
                <Button variant="primary" size="md">
                  Explore Businesses
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setActiveTab("ALL");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        // List of Real Appointment Cards
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {filteredAppointments.map((appt) => {
            const biz = appt.businessId || {};
            const srv = appt.serviceId || {};
            const apptId = appt._id || "";
            const displayRef = `#${apptId.slice(-8).toUpperCase()}`;
            const isCanCancel = appt.status === "PENDING" || appt.status === "CONFIRMED";
            const isUpcoming = isAppointmentUpcoming(appt.date, todayStr);

            return (
              <div
                key={apptId}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.medium,
                  boxShadow: SHADOWS.card,
                  padding: isMobile ? "20px 16px" : "24px 28px",
                  transition: `all ${TRANSITIONS.fast}`
                }}
              >
                {/* Card Top Row: Reference, Date, Status */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    paddingBottom: "14px",
                    borderBottom: `1px solid ${COLORS.border}`,
                    marginBottom: "16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: COLORS.primaryDark,
                        background: COLORS.primaryBg,
                        padding: "3px 8px",
                        borderRadius: RADIUS.xs
                      }}
                    >
                      {displayRef}
                    </span>

                    {isUpcoming && (appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: COLORS.info,
                          background: COLORS.lightBlue,
                          padding: "2px 8px",
                          borderRadius: RADIUS.pill
                        }}
                      >
                        Upcoming
                      </span>
                    )}

                    <span style={{ fontSize: "12px", color: COLORS.muted }}>
                      Booked on {formatCreatedDate(appt.createdAt)}
                    </span>
                  </div>

                  <div>{renderStatusBadge(appt.status)}</div>
                </div>

                {/* Card Main Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr 1fr",
                    gap: "20px",
                    alignItems: "start"
                  }}
                >
                  {/* Business & Location */}
                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                      Merchant
                    </span>
                    <h3
                      style={{
                        fontSize: "17px",
                        fontWeight: "700",
                        color: COLORS.secondary,
                        margin: "2px 0 4px"
                      }}
                    >
                      {biz.name || "Business"}
                    </h3>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "13px", color: COLORS.textSecondary }}>
                      <FaMapMarkerAlt color={COLORS.primary} size={12} style={{ marginTop: "3px", flexShrink: 0 }} />
                      <span>{biz.address ? `${biz.address}, ${biz.city}` : "Address upon confirmation"}</span>
                    </div>
                  </div>

                  {/* Service & Price */}
                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                      Service Booked
                    </span>
                    <strong style={{ fontSize: "15px", color: COLORS.secondary, display: "block", marginTop: "2px" }}>
                      {srv.name || "Service"}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", fontSize: "13px" }}>
                      <span style={{ color: COLORS.muted, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <FaClock size={11} /> {formatDuration(srv.duration)}
                      </span>
                      <strong style={{ color: COLORS.primaryDark, fontSize: "15px" }}>
                        {formatPrice(appt.price || srv.price)}
                      </strong>
                    </div>
                  </div>

                  {/* Appointment Schedule */}
                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                      Scheduled For
                    </span>
                    <strong style={{ fontSize: "15px", color: COLORS.secondary, display: "block", marginTop: "2px" }}>
                      {formatDateDisplay(appt.date)}
                    </strong>
                    <div style={{ fontSize: "13px", color: COLORS.textSecondary, marginTop: "2px" }}>
                      {formatTimeDisplay(appt.time)}
                    </div>
                  </div>
                </div>

                {/* Notes (if provided) */}
                {appt.notes && (
                  <div
                    style={{
                      background: COLORS.surfaceSubtle,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: RADIUS.small,
                      padding: "10px 14px",
                      marginTop: "16px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px"
                    }}
                  >
                    <FaStickyNote color={COLORS.muted} size={13} style={{ marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <span style={{ color: COLORS.muted, fontWeight: "600", fontSize: "11px", textTransform: "uppercase", display: "block" }}>
                        Your Booking Note:
                      </span>
                      <span style={{ color: COLORS.textSecondary, fontStyle: "italic" }}>
                        &ldquo;{appt.notes}&rdquo;
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginTop: "18px",
                    paddingTop: "14px",
                    borderTop: `1px solid ${COLORS.border}`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaMoneyBillWave size={12} color={COLORS.success} />
                    <span style={{ fontSize: "12px", color: COLORS.muted }}>
                      Payment: Pay venue upon service completion
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* View Full Appointment Details */}
                    <Link to={`/appointment/${apptId}`} style={{ textDecoration: "none" }}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </Link>

                    {/* View Business */}
                    {biz._id && (
                      <Link to={`/business/${biz._id}`} style={{ textDecoration: "none" }}>
                        <Button variant="ghost" size="sm">
                          Merchant Details
                        </Button>
                      </Link>
                    )}

                    {/* Book Again */}
                    {biz._id && (
                      <Link
                        to={`/book/${biz._id}${srv._id ? `?serviceId=${srv._id}` : ""}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Button variant="outline" size="sm" icon={<FaRedoAlt />}>
                          Book Again
                        </Button>
                      </Link>
                    )}

                    {/* Cancel Appointment Button */}
                    {isCanCancel && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelModal({ isOpen: true, appointment: appt })}
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModal.isOpen && cancelModal.appointment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 17, 35, 0.6)",
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
              padding: isMobile ? "24px 20px" : "32px 28px",
              maxWidth: "480px",
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
              Cancel This Appointment?
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: COLORS.textSecondary,
                lineHeight: "1.6",
                margin: "0 0 16px"
              }}
            >
              Are you sure you want to cancel your appointment with{" "}
              <strong>{cancelModal.appointment.businessId?.name || "the merchant"}</strong> for{" "}
              <strong>{cancelModal.appointment.serviceId?.name || "service"}</strong> scheduled on{" "}
              <strong>{formatDateDisplay(cancelModal.appointment.date)}</strong> at{" "}
              <strong>{formatTimeDisplay(cancelModal.appointment.time)}</strong>?
            </p>

            <div
              style={{
                background: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.small,
                padding: "10px 14px",
                fontSize: "12px",
                color: COLORS.muted,
                marginBottom: "24px"
              }}
            >
              This appointment will be marked as cancelled immediately and the booked time slot will be released.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => setCancelModal({ isOpen: false, appointment: null })}
                disabled={isCancelling}
              >
                Keep Appointment
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmCancel}
                loading={isCancelling}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
