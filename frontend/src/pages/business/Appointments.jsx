import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaSearch,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaStickyNote,
  FaStore,
  FaCheck,
  FaTimes,
  FaRedoAlt,
  FaUserCheck
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import appointmentService from "../../services/appointmentService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

function Appointments() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Data fetching state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNoBusiness, setHasNoBusiness] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Filter & Search state
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("date_asc");

  // Action Modals State
  // { isOpen: boolean, type: 'CONFIRM' | 'REJECT' | 'COMPLETE', appointment: object | null }
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null,
    appointment: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  // Toast notification
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }

  // Load appointments initially
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        setHasNoBusiness(false);
        const res = await appointmentService.getBusinessAppointments();
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
          if (err.status === 404) {
            setHasNoBusiness(true);
          } else {
            setLoadError(
              err.customMessage ||
                err.message ||
                "Failed to load business appointments."
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

  // Manual refresh handler
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      setHasNoBusiness(false);
      const res = await appointmentService.getBusinessAppointments();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.appointments)
        ? res.appointments
        : Array.isArray(res)
        ? res
        : [];
      setAppointments(list);
    } catch (err) {
      if (err.status === 404) {
        setHasNoBusiness(true);
      } else {
        setLoadError(
          err.customMessage ||
            err.message ||
            "Failed to load business appointments."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Format Helpers
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

  function formatTimestamp(ts) {
    if (!ts) return "Recently";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  // Handle Transition Actions (CONFIRM | REJECT | COMPLETE)
  async function handleExecuteAction() {
    const { type, appointment } = actionModal;
    if (!appointment?._id || !type) return;

    try {
      setIsProcessing(true);
      setActionError("");
      const apptId = appointment._id;

      let res;
      if (type === "CONFIRM") {
        res = await appointmentService.updateAppointmentStatus(apptId, "CONFIRMED");
      } else if (type === "REJECT") {
        res = await appointmentService.updateAppointmentStatus(apptId, "REJECTED");
      } else if (type === "COMPLETE") {
        res = await appointmentService.completeAppointment(apptId);
      }

      const updated = res?.data || res?.appointment;
      const newStatus = updated?.status || (type === "CONFIRM" ? "CONFIRMED" : type === "REJECT" ? "REJECTED" : "COMPLETED");

      setAppointments((prev) =>
        prev.map((item) =>
          item._id === apptId ? { ...item, status: newStatus } : item
        )
      );

      setActionModal({ isOpen: false, type: null, appointment: null });

      const msg =
        type === "CONFIRM"
          ? "Appointment confirmed! Customer has been approved."
          : type === "REJECT"
          ? "Appointment request declined."
          : "Appointment marked as completed. Revenue added!";
      showToast(msg);
    } catch (err) {
      if (err.status === 409) {
        setActionError(
          "Appointment status has already been updated by the customer or server. Please refresh your list."
        );
      } else {
        setActionError(
          err.customMessage ||
            err.message ||
            "Unable to update appointment status."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }

  // Metrics computation
  const metrics = useMemo(() => {
    let all = appointments.length;
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;
    let grossRevenue = 0;

    appointments.forEach((item) => {
      const status = item.status;
      if (status === "PENDING") pending++;
      if (status === "CONFIRMED") confirmed++;
      if (status === "COMPLETED") {
        completed++;
        if (typeof item.price === "number") grossRevenue += item.price;
      }
      if (status === "CANCELLED" || status === "REJECTED") cancelled++;
    });

    return { all, pending, confirmed, completed, cancelled, grossRevenue };
  }, [appointments]);

  // Filtered & Sorted Appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((item) => {
        if (activeTab === "PENDING") return item.status === "PENDING";
        if (activeTab === "CONFIRMED") return item.status === "CONFIRMED";
        if (activeTab === "COMPLETED") return item.status === "COMPLETED";
        if (activeTab === "CANCELLED") {
          return item.status === "CANCELLED" || item.status === "REJECTED";
        }
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const custName = item.customerId?.name?.toLowerCase() || "";
        const custEmail = item.customerId?.email?.toLowerCase() || "";
        const srvName = item.serviceId?.name?.toLowerCase() || "";
        return custName.includes(q) || custEmail.includes(q) || srvName.includes(q);
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
  }, [appointments, activeTab, searchQuery, sortOrder]);

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
        label = "Pending Action";
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
        label = "Cancelled by Customer";
        break;
      case "REJECTED":
        bg = COLORS.dangerBg;
        color = COLORS.danger;
        border = COLORS.dangerBorder;
        icon = <FaTimesCircle size={11} />;
        label = "Declined by You";
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
        <Loader size="lg" message="Loading business appointments..." />
      </div>
    );
  }

  // Blocker: Business profile not registered
  if (hasNoBusiness) {
    return (
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.card,
          padding: isMobile ? "32px 20px" : "56px 40px",
          textAlign: "center",
          maxWidth: "620px",
          margin: "40px auto 0"
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
            margin: "0 auto 20px"
          }}
        >
          <FaStore />
        </div>

        <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
          Business Profile Required
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: COLORS.textSecondary,
            lineHeight: "1.6",
            maxWidth: "460px",
            margin: "0 auto 28px"
          }}
        >
          Please register your business profile before viewing and managing incoming customer appointments.
        </p>

        <Link to="/business/manage" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg">
            Create Business Profile Now
          </Button>
        </Link>
      </div>
    );
  }

  // Error loading state
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
          Unable to Load Appointments
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={fetchAppointments}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: "18px",
          marginBottom: "28px"
        }}
      >
        <div>
          <h1
            style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.secondary,
              margin: "0 0 6px",
              fontSize: isMobile ? "24px" : "30px"
            }}
          >
            Customer Bookings & Appointments
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: COLORS.muted }}>
            Review, confirm, decline, and complete appointment bookings for your business.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<FaRedoAlt />}
          onClick={fetchAppointments}
        >
          Refresh Bookings
        </Button>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            background: toast.type === "success" ? COLORS.successBg : COLORS.dangerBg,
            border: `1px solid ${
              toast.type === "success" ? COLORS.successBorder : COLORS.dangerBorder
            }`,
            color: toast.type === "success" ? COLORS.success : COLORS.danger,
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
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Metrics Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr 1fr"
            : "repeat(5, 1fr)",
          gap: "14px",
          marginBottom: "28px"
        }}
      >
        {/* Total */}
        <div
          onClick={() => setActiveTab("ALL")}
          style={{
            background: activeTab === "ALL" ? COLORS.primaryBg : COLORS.surface,
            border: `1px solid ${activeTab === "ALL" ? COLORS.primary : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px 18px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: COLORS.muted, fontWeight: "700", textTransform: "uppercase" }}>
            Total Bookings
          </span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
            {metrics.all}
          </div>
        </div>

        {/* Pending Action */}
        <div
          onClick={() => setActiveTab("PENDING")}
          style={{
            background: activeTab === "PENDING" ? COLORS.warningBg : COLORS.surface,
            border: `1px solid ${activeTab === "PENDING" ? COLORS.warningBorder : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px 18px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: "#9A6200", fontWeight: "700", textTransform: "uppercase" }}>
            Needs Action
          </span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#9A6200", marginTop: "2px" }}>
            {metrics.pending}
          </div>
        </div>

        {/* Confirmed */}
        <div
          onClick={() => setActiveTab("CONFIRMED")}
          style={{
            background: activeTab === "CONFIRMED" ? COLORS.lightBlue : COLORS.surface,
            border: `1px solid ${activeTab === "CONFIRMED" ? COLORS.info : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px 18px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: COLORS.info, fontWeight: "700", textTransform: "uppercase" }}>
            Confirmed
          </span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.info, marginTop: "2px" }}>
            {metrics.confirmed}
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab("COMPLETED")}
          style={{
            background: activeTab === "COMPLETED" ? COLORS.successBg : COLORS.surface,
            border: `1px solid ${activeTab === "COMPLETED" ? COLORS.successBorder : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px 18px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: COLORS.success, fontWeight: "700", textTransform: "uppercase" }}>
            Completed
          </span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.success, marginTop: "2px" }}>
            {metrics.completed}
          </div>
        </div>

        {/* Gross Revenue */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "16px 18px",
            boxShadow: SHADOWS.card,
            gridColumn: isMobile ? "span 2" : "auto"
          }}
        >
          <span style={{ fontSize: "11px", color: COLORS.primaryDark, fontWeight: "700", textTransform: "uppercase" }}>
            Completed Revenue
          </span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: COLORS.primaryDark, marginTop: "2px" }}>
            {formatPrice(metrics.grossRevenue)}
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
            { id: "ALL", label: "All Bookings", count: metrics.all },
            { id: "PENDING", label: "Pending Action", count: metrics.pending },
            { id: "CONFIRMED", label: "Confirmed", count: metrics.confirmed },
            { id: "COMPLETED", label: "Completed", count: metrics.completed },
            { id: "CANCELLED", label: "Cancelled / Declined", count: metrics.cancelled }
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
              flex: isMobile ? "1 1 100%" : "0 0 220px"
            }}
          >
            <FaSearch color={COLORS.muted} size={12} />
            <input
              type="text"
              placeholder="Search customer, service..."
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
            <option value="date_asc">Schedule Date (Soonest)</option>
            <option value="date_desc">Schedule Date (Latest)</option>
            <option value="created_desc">Booked Date (Newest)</option>
          </select>
        </div>
      </div>

      {/* Appointments List / Empty State */}
      {appointments.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "36px 20px" : "64px 32px",
            textAlign: "center",
            maxWidth: "620px",
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
            No Customer Bookings Yet
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
            When customers discover your business and book appointments on the APNA-BAZAR marketplace, they will appear here for your confirmation and fulfillment.
          </p>

          <Link to="/business/manage" style={{ textDecoration: "none" }}>
            <Button variant="outline" size="md">
              Check Business Profile
            </Button>
          </Link>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "40px 24px",
            textAlign: "center",
            color: COLORS.muted
          }}
        >
          <p style={{ margin: "0 0 14px", fontSize: "14px" }}>
            No appointments found for &ldquo;{activeTab.toLowerCase()}&rdquo; filter or query &ldquo;{searchQuery}&rdquo;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab("ALL");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {filteredAppointments.map((appt) => {
            const cust = appt.customerId || {};
            const srv = appt.serviceId || {};
            const apptId = appt._id || "";
            const displayRef = `#${apptId.slice(-8).toUpperCase()}`;
            const status = appt.status || "PENDING";
            const isPending = status === "PENDING";
            const isConfirmed = status === "CONFIRMED";

            return (
              <div
                key={apptId}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${
                    isPending ? COLORS.warningBorder : COLORS.border
                  }`,
                  borderRadius: RADIUS.medium,
                  boxShadow: SHADOWS.card,
                  padding: isMobile ? "20px 16px" : "24px 28px",
                  transition: `all ${TRANSITIONS.fast}`
                }}
              >
                {/* Card Top Row: Ref, Booking Date, Status Pill */}
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

                    <span style={{ fontSize: "12px", color: COLORS.muted }}>
                      Booked on {formatTimestamp(appt.createdAt)}
                    </span>
                  </div>

                  <div>{renderStatusBadge(status)}</div>
                </div>

                {/* Card Main Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr 1fr",
                    gap: "18px",
                    alignItems: "start"
                  }}
                >
                  {/* Customer Details */}
                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                      Customer
                    </span>
                    <strong style={{ fontSize: "16px", color: COLORS.secondary, display: "block", marginTop: "2px" }}>
                      {cust.name || "Customer Account"}
                    </strong>
                    <div style={{ fontSize: "13px", color: COLORS.textSecondary, marginTop: "2px" }}>
                      {cust.email || "No email on file"}
                    </div>
                  </div>

                  {/* Service & Price */}
                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                      Requested Service
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

                  {/* Scheduled Date & Time */}
                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", display: "block" }}>
                      Scheduled Time
                    </span>
                    <strong style={{ fontSize: "15px", color: COLORS.secondary, display: "block", marginTop: "2px" }}>
                      {formatDateDisplay(appt.date)}
                    </strong>
                    <div style={{ fontSize: "13px", color: COLORS.textSecondary, marginTop: "2px" }}>
                      {formatTimeDisplay(appt.time)}
                    </div>
                  </div>
                </div>

                {/* Customer Notes */}
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
                        Customer Instructions:
                      </span>
                      <span style={{ color: COLORS.textSecondary, fontStyle: "italic" }}>
                        &ldquo;{appt.notes}&rdquo;
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Action Bar */}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: COLORS.muted }}>
                    <FaMoneyBillWave color={COLORS.success} />
                    <span>Pay at venue &bull; Amount: {formatPrice(appt.price || srv.price)}</span>
                  </div>

                  {/* Action Buttons based on status */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* PENDING: Accept / Confirm or Decline */}
                    {isPending && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<FaTimes />}
                          onClick={() =>
                            setActionModal({
                              isOpen: true,
                              type: "REJECT",
                              appointment: appt
                            })
                          }
                        >
                          Decline
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          icon={<FaCheck />}
                          onClick={() =>
                            setActionModal({
                              isOpen: true,
                              type: "CONFIRM",
                              appointment: appt
                            })
                          }
                        >
                          Confirm & Accept
                        </Button>
                      </>
                    )}

                    {/* CONFIRMED: Mark as Complete */}
                    {isConfirmed && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<FaUserCheck />}
                        onClick={() =>
                          setActionModal({
                            isOpen: true,
                            type: "COMPLETE",
                            appointment: appt
                          })
                        }
                      >
                        Mark as Completed
                      </Button>
                    )}

                    {/* Terminal States Notice */}
                    {status === "COMPLETED" && (
                      <span style={{ fontSize: "13px", fontWeight: "600", color: COLORS.success, display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaCheckCircle /> Service Completed
                      </span>
                    )}

                    {(status === "CANCELLED" || status === "REJECTED") && (
                      <span style={{ fontSize: "13px", color: COLORS.muted, fontStyle: "italic" }}>
                        No further action needed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Action Modal */}
      {actionModal.isOpen && actionModal.appointment && (
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
                background:
                  actionModal.type === "CONFIRM"
                    ? COLORS.primaryBg
                    : actionModal.type === "COMPLETE"
                    ? COLORS.successBg
                    : COLORS.dangerBg,
                color:
                  actionModal.type === "CONFIRM"
                    ? COLORS.primary
                    : actionModal.type === "COMPLETE"
                    ? COLORS.success
                    : COLORS.danger,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "16px"
              }}
            >
              {actionModal.type === "CONFIRM" && <FaCheckCircle />}
              {actionModal.type === "COMPLETE" && <FaUserCheck />}
              {actionModal.type === "REJECT" && <FaTimesCircle />}
            </div>

            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
              {actionModal.type === "CONFIRM"
                ? "Confirm Appointment Request?"
                : actionModal.type === "COMPLETE"
                ? "Mark Appointment as Completed?"
                : "Decline Appointment Request?"}
            </h3>

            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5", margin: "0 0 16px" }}>
              {actionModal.type === "CONFIRM" && (
                <>
                  You are confirming the booking for{" "}
                  <strong>{actionModal.appointment.customerId?.name || "Customer"}</strong> for{" "}
                  <strong>{actionModal.appointment.serviceId?.name || "Service"}</strong> on{" "}
                  <strong>{formatDateDisplay(actionModal.appointment.date)}</strong> at{" "}
                  <strong>{formatTimeDisplay(actionModal.appointment.time)}</strong>.
                </>
              )}

              {actionModal.type === "COMPLETE" && (
                <>
                  Confirm that{" "}
                  <strong>{actionModal.appointment.customerId?.name || "Customer"}</strong> has received the service and paid the fee of{" "}
                  <strong>{formatPrice(actionModal.appointment.price)}</strong>.
                </>
              )}

              {actionModal.type === "REJECT" && (
                <>
                  Are you sure you want to decline this booking request from{" "}
                  <strong>{actionModal.appointment.customerId?.name || "Customer"}</strong>? The time slot will remain available for other bookings.
                </>
              )}
            </p>

            {/* Error message in modal if race condition occurred */}
            {actionError && (
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
                {actionError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setActionModal({ isOpen: false, type: null, appointment: null });
                  setActionError("");
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>

              <Button
                variant={actionModal.type === "REJECT" ? "danger" : "primary"}
                size="md"
                onClick={handleExecuteAction}
                loading={isProcessing}
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Processing..."
                  : actionModal.type === "CONFIRM"
                  ? "Yes, Confirm Booking"
                  : actionModal.type === "COMPLETE"
                  ? "Yes, Mark Completed"
                  : "Yes, Decline Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
