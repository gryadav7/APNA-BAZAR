import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaStore,
  FaMapMarkerAlt,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSearch,
  FaStar,
  FaExternalLinkAlt,
  FaRedoAlt,
  FaBan,
  FaCheck,
  FaTrashAlt,
  FaCrown,
  FaGem
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

function AdminBusinesses() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Data fetching state
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filters & Search
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | ACTIVE | SUSPENDED | BLOCKED
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Status moderation modal
  // { isOpen: boolean, business: object | null, targetStatus: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' }
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    business: null,
    targetStatus: null
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Permanent Delete Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    business: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Load businesses initially
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        const res = await adminService.getAllBusinesses();
        const list = Array.isArray(res?.businesses)
          ? res.businesses
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        if (isMounted) {
          setBusinesses(list);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err.customMessage ||
              err.message ||
              "Failed to load business directory."
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

  // Manual refresh handler
  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await adminService.getAllBusinesses();
      const list = Array.isArray(res?.businesses)
        ? res.businesses
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setBusinesses(list);
    } catch (err) {
      setLoadError(
        err.customMessage ||
          err.message ||
          "Failed to load business directory."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Status Update Execution
  async function handleConfirmStatusUpdate() {
    const { business, targetStatus } = statusModal;
    if (!business?._id || !targetStatus) return;

    try {
      setIsUpdating(true);
      const res = await adminService.updateBusinessStatus(business._id, targetStatus);
      const updated = res?.business || res?.data;

      setBusinesses((prev) =>
        prev.map((item) =>
          item._id === business._id
            ? { ...item, status: updated?.status || targetStatus }
            : item
        )
      );

      setStatusModal({ isOpen: false, business: null, targetStatus: null });
      showToast(
        `Business "${business.name}" status updated to ${targetStatus}.`
      );
    } catch (err) {
      showToast(
        err.customMessage ||
          err.message ||
          "Failed to update business status.",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle Permanent Delete Execution
  async function handleConfirmDeleteBusiness() {
    const { business } = deleteModal;
    if (!business?._id) return;

    try {
      setIsDeleting(true);
      await adminService.deleteBusiness(business._id);
      setBusinesses((prev) => prev.filter((item) => item._id !== business._id));
      setDeleteModal({ isOpen: false, business: null });
      showToast(`Business "${business.name}" has been permanently deleted.`);
    } catch (err) {
      showToast(
        err.customMessage || err.message || "Failed to delete business.",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // Categories list extracted from data
  const categoriesList = useMemo(() => {
    const set = new Set();
    businesses.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set).sort();
  }, [businesses]);

  // Status Metrics
  const metrics = useMemo(() => {
    let all = businesses.length;
    let active = 0;
    let suspended = 0;
    let blocked = 0;

    businesses.forEach((b) => {
      const s = b.status || "ACTIVE";
      if (s === "ACTIVE") active++;
      if (s === "SUSPENDED") suspended++;
      if (s === "BLOCKED") blocked++;
    });

    return { all, active, suspended, blocked };
  }, [businesses]);

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    return businesses
      .filter((b) => {
        const s = b.status || "ACTIVE";
        if (activeTab === "ACTIVE") return s === "ACTIVE";
        if (activeTab === "SUSPENDED") return s === "SUSPENDED";
        if (activeTab === "BLOCKED") return s === "BLOCKED";
        return true;
      })
      .filter((b) => {
        if (!categoryFilter) return true;
        return b.category === categoryFilter;
      })
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const bizName = b.name?.toLowerCase() || "";
        const city = b.city?.toLowerCase() || "";
        const ownerName = b.ownerId?.name?.toLowerCase() || "";
        const ownerEmail = b.ownerId?.email?.toLowerCase() || "";
        return (
          bizName.includes(q) ||
          city.includes(q) ||
          ownerName.includes(q) ||
          ownerEmail.includes(q)
        );
      });
  }, [businesses, activeTab, categoryFilter, searchQuery]);

  // Status Badge Component
  function renderStatusPill(status) {
    let bg = COLORS.successBg;
    let color = COLORS.success;
    let border = COLORS.successBorder;
    let icon = <FaCheckCircle size={11} />;

    if (status === "SUSPENDED") {
      bg = COLORS.warningBg;
      color = "#9A6200";
      border = COLORS.warningBorder;
      icon = <FaExclamationTriangle size={11} />;
    } else if (status === "BLOCKED") {
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
        <span>{status || "ACTIVE"}</span>
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
        <Loader size="lg" message="Loading business directory..." />
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
          Unable to Load Directory
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={fetchBusinesses}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
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
            Business Directory & Moderation
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: COLORS.muted }}>
            Review registered businesses, inspect merchant owners, and moderate active status across the marketplace.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<FaRedoAlt />}
          onClick={fetchBusinesses}
        >
          Refresh Directory
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

      {/* Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr 1fr"
            : "repeat(4, 1fr)",
          gap: "16px",
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
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: COLORS.muted, fontWeight: "700", textTransform: "uppercase" }}>
            Total Businesses
          </span>
          <div style={{ fontSize: "26px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
            {metrics.all}
          </div>
        </div>

        {/* Active */}
        <div
          onClick={() => setActiveTab("ACTIVE")}
          style={{
            background: activeTab === "ACTIVE" ? COLORS.successBg : COLORS.surface,
            border: `1px solid ${activeTab === "ACTIVE" ? COLORS.successBorder : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: COLORS.success, fontWeight: "700", textTransform: "uppercase" }}>
            Active & Verified
          </span>
          <div style={{ fontSize: "26px", fontWeight: "800", color: COLORS.success, marginTop: "2px" }}>
            {metrics.active}
          </div>
        </div>

        {/* Suspended */}
        <div
          onClick={() => setActiveTab("SUSPENDED")}
          style={{
            background: activeTab === "SUSPENDED" ? COLORS.warningBg : COLORS.surface,
            border: `1px solid ${activeTab === "SUSPENDED" ? COLORS.warningBorder : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: "#9A6200", fontWeight: "700", textTransform: "uppercase" }}>
            Suspended
          </span>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#9A6200", marginTop: "2px" }}>
            {metrics.suspended}
          </div>
        </div>

        {/* Blocked */}
        <div
          onClick={() => setActiveTab("BLOCKED")}
          style={{
            background: activeTab === "BLOCKED" ? COLORS.dangerBg : COLORS.surface,
            border: `1px solid ${activeTab === "BLOCKED" ? COLORS.dangerBorder : COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "18px 20px",
            boxShadow: SHADOWS.card,
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <span style={{ fontSize: "11px", color: COLORS.danger, fontWeight: "700", textTransform: "uppercase" }}>
            Blocked / Restricted
          </span>
          <div style={{ fontSize: "26px", fontWeight: "800", color: COLORS.danger, marginTop: "2px" }}>
            {metrics.blocked}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
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
            { id: "ALL", label: "All Businesses", count: metrics.all },
            { id: "ACTIVE", label: "Active", count: metrics.active },
            { id: "SUSPENDED", label: "Suspended", count: metrics.suspended },
            { id: "BLOCKED", label: "Blocked", count: metrics.blocked }
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

        {/* Right Search & Category Filter */}
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
              placeholder="Search business, owner, city..."
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

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
            <option value="">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Businesses List */}
      {businesses.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "36px 20px" : "64px 32px",
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: RADIUS.round,
              background: COLORS.primaryBg,
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

          <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
            No Businesses Registered Yet
          </h2>

          <p style={{ fontSize: "14px", color: COLORS.textSecondary, maxWidth: "440px", margin: "0 auto" }}>
            When business owners create profiles on APNA-BAZAR, their listings will appear here for administrative moderation.
          </p>
        </div>
      ) : filteredBusinesses.length === 0 ? (
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
            No businesses match your active filter criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab("ALL");
              setSearchQuery("");
              setCategoryFilter("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredBusinesses.map((biz) => {
            const owner = biz.ownerId || {};
            const status = biz.status || "ACTIVE";
            const hasActualRating = typeof biz.rating === "number" && biz.rating > 0;

            return (
              <div
                key={biz._id}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${
                    status === "BLOCKED"
                      ? COLORS.dangerBorder
                      : status === "SUSPENDED"
                      ? COLORS.warningBorder
                      : COLORS.border
                  }`,
                  borderRadius: RADIUS.medium,
                  boxShadow: SHADOWS.card,
                  padding: isMobile ? "20px 16px" : "24px 28px",
                  display: "flex",
                  flexDirection: isCompact ? "column" : "row",
                  alignItems: isCompact ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: "20px",
                  transition: `all ${TRANSITIONS.fast}`
                }}
              >
                {/* Main Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: COLORS.secondary,
                        margin: 0
                      }}
                    >
                      {biz.name}
                    </h3>

                    {renderStatusPill(status)}

                    <span
                      style={{
                        padding: "2px 8px",
                        background: COLORS.primaryBg,
                        color: COLORS.primaryDark,
                        borderRadius: RADIUS.xs,
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase"
                      }}
                    >
                      {biz.category}
                    </span>

                    {/* Subscription Tier Badge */}
                    {biz.subscriptionTier === "PREMIUM" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                          color: "#92400E",
                          border: "1px solid #F59E0B",
                          borderRadius: RADIUS.xs,
                          fontSize: "11px",
                          fontWeight: "800",
                          letterSpacing: "0.5px"
                        }}
                      >
                        <FaCrown size={11} color="#D97706" />
                        PREMIUM
                      </span>
                    ) : biz.subscriptionTier === "PRO" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                          color: "#3730A3",
                          border: "1px solid #6366F1",
                          borderRadius: RADIUS.xs,
                          fontSize: "11px",
                          fontWeight: "800",
                          letterSpacing: "0.5px"
                        }}
                      >
                        <FaGem size={10} color="#4F46E5" />
                        PRO
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: "2px 8px",
                          background: COLORS.surfaceSubtle,
                          color: COLORS.textSecondary,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: RADIUS.xs,
                          fontSize: "11px",
                          fontWeight: "600"
                        }}
                      >
                        FREE TIER
                      </span>
                    )}

                    {/* Rating if > 0 */}
                    {hasActualRating && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          color: "#9A6200",
                          fontWeight: "700"
                        }}
                      >
                        <FaStar color={COLORS.warning} size={11} />
                        {biz.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Location & Owner Details */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      flexWrap: "wrap",
                      fontSize: "13px",
                      color: COLORS.textSecondary,
                      marginTop: "6px"
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <FaMapMarkerAlt color={COLORS.primary} size={12} />
                      {biz.address}, {biz.city}
                    </span>

                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <FaUserTie color={COLORS.muted} size={12} />
                      Owner: <strong>{owner.name || "Owner"}</strong> ({owner.email || "No email"})
                    </span>
                  </div>

                  {biz.description && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: COLORS.muted,
                        lineHeight: "1.5",
                        margin: "8px 0 0",
                        maxWidth: "700px"
                      }}
                    >
                      {biz.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flexShrink: 0 }}>
                  {/* Public Link */}
                  <Link
                    to={`/business/${biz._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <Button variant="ghost" size="sm" icon={<FaExternalLinkAlt size={11} />}>
                      View Page
                    </Button>
                  </Link>

                  {/* Moderation Status Actions */}
                  {status === "ACTIVE" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<FaExclamationTriangle />}
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            business: biz,
                            targetStatus: "SUSPENDED"
                          })
                        }
                      >
                        Suspend
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        icon={<FaBan />}
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            business: biz,
                            targetStatus: "BLOCKED"
                          })
                        }
                      >
                        Block
                      </Button>
                    </>
                  )}

                  {status === "SUSPENDED" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<FaCheck />}
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            business: biz,
                            targetStatus: "ACTIVE"
                          })
                        }
                      >
                        Reactivate
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        icon={<FaBan />}
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            business: biz,
                            targetStatus: "BLOCKED"
                          })
                        }
                      >
                        Block
                      </Button>
                    </>
                  )}

                  {status === "BLOCKED" && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<FaCheck />}
                      onClick={() =>
                        setStatusModal({
                          isOpen: true,
                          business: biz,
                          targetStatus: "ACTIVE"
                        })
                      }
                    >
                      Unblock & Activate
                    </Button>
                  )}

                  {/* Permanent Delete Action */}
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<FaTrashAlt size={11} />}
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        business: biz
                      })
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Moderation Confirmation Modal */}
      {statusModal.isOpen && statusModal.business && (
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
                  statusModal.targetStatus === "ACTIVE"
                    ? COLORS.successBg
                    : statusModal.targetStatus === "SUSPENDED"
                    ? COLORS.warningBg
                    : COLORS.dangerBg,
                color:
                  statusModal.targetStatus === "ACTIVE"
                    ? COLORS.success
                    : statusModal.targetStatus === "SUSPENDED"
                    ? "#9A6200"
                    : COLORS.danger,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "16px"
              }}
            >
              {statusModal.targetStatus === "ACTIVE" ? <FaCheckCircle /> : <FaBan />}
            </div>

            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
              Update Business Status?
            </h3>

            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5", margin: "0 0 16px" }}>
              Are you sure you want to change the status of{" "}
              <strong>&ldquo;{statusModal.business.name}&rdquo;</strong> to{" "}
              <strong>{statusModal.targetStatus}</strong>?
            </p>

            <div
              style={{
                background: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.xs,
                padding: "10px 14px",
                fontSize: "12px",
                color: COLORS.muted,
                marginBottom: "24px"
              }}
            >
              {statusModal.targetStatus === "ACTIVE" &&
                "The business will become fully visible and discoverable by customers on the marketplace."}
              {statusModal.targetStatus === "SUSPENDED" &&
                "The business will be temporarily marked as suspended and new bookings will be paused."}
              {statusModal.targetStatus === "BLOCKED" &&
                "The business will be restricted immediately from receiving any appointments."}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  setStatusModal({ isOpen: false, business: null, targetStatus: null })
                }
                disabled={isUpdating}
              >
                Cancel
              </Button>

              <Button
                variant={statusModal.targetStatus === "BLOCKED" ? "danger" : "primary"}
                size="md"
                onClick={handleConfirmStatusUpdate}
                loading={isUpdating}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : `Confirm ${statusModal.targetStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {deleteModal.isOpen && deleteModal.business && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 17, 35, 0.75)",
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
                background: COLORS.dangerBg,
                color: COLORS.danger,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "16px"
              }}
            >
              <FaTrashAlt />
            </div>

            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.danger, margin: "0 0 8px" }}>
              Permanently Delete Business?
            </h3>

            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5", margin: "0 0 16px" }}>
              Are you sure you want to permanently delete <strong>&ldquo;{deleteModal.business.name}&rdquo;</strong>?
            </p>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${COLORS.dangerBorder}`,
                borderRadius: RADIUS.xs,
                padding: "12px 14px",
                fontSize: "12px",
                color: COLORS.danger,
                lineHeight: "1.5",
                marginBottom: "24px"
              }}
            >
              <strong>Warning:</strong> This action is permanent and irreversible. All registered business services, operating availability schedules, and appointments linked to this store will be automatically cleaned up.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeleteModal({ isOpen: false, business: null })}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDeleteBusiness}
                loading={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting Store..." : "Confirm Permanent Deletion"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBusinesses;
