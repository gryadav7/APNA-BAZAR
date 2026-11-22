import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaUsers,
  FaUserCheck,
  FaUserTie,
  FaUserShield,
  FaSearch,
  FaRedoAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaIdBadge,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaExclamationTriangle,
  FaBan,
  FaTrashAlt,
  FaCheckCircle
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import adminService from "../../services/adminService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

// Pure date formatting helper
function formatRegistrationDate(dateString) {
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

// Pure initials extractor
function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function AdminUsers() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;
  const { user: currentAdmin } = useAuth();

  // Data fetching state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filters & Search
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | CUSTOMER | BUSINESS_OWNER | ADMIN | BLOCKED
  const [searchQuery, setSearchQuery] = useState("");

  // User detail inspection modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Status Moderation Modal (Block / Unblock)
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    user: null,
    targetStatus: null
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Permanent Delete Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Load all users on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        const res = await adminService.getAllUsers();
        const list = Array.isArray(res?.users)
          ? res.users
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        if (isMounted) {
          setUsers(list);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err.customMessage ||
              err.message ||
              "Failed to load user directory from backend."
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
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await adminService.getAllUsers();
      const list = Array.isArray(res?.users)
        ? res.users
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setUsers(list);
    } catch (err) {
      setLoadError(
        err.customMessage ||
          err.message ||
          "Failed to load user directory from backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Metric counts derived from real user state
  const metrics = useMemo(() => {
    let total = users.length;
    let customers = 0;
    let businessOwners = 0;
    let admins = 0;
    let active = 0;
    let blocked = 0;

    users.forEach((u) => {
      const role = u.role ? u.role.toUpperCase() : "CUSTOMER";
      if (role === "CUSTOMER") customers++;
      else if (role === "BUSINESS_OWNER") businessOwners++;
      else if (role === "ADMIN") admins++;

      if (u.status === "BLOCKED") blocked++;
      else active++;
    });

    return { total, customers, businessOwners, admins, active, blocked };
  }, [users]);

  // Filtered users according to active role tab & search query
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (activeTab === "ALL") return true;
        if (activeTab === "BLOCKED") return u.status === "BLOCKED";
        if (activeTab === "ACTIVE") return u.status !== "BLOCKED";
        const role = u.role ? u.role.toUpperCase() : "CUSTOMER";
        return role === activeTab;
      })
      .filter((u) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
  }, [users, activeTab, searchQuery]);

  // Handle User Status Update (Block / Unblock)
  async function handleConfirmUserStatus() {
    const { user: targetUser, targetStatus } = statusModal;
    if (!targetUser?._id || !targetStatus) return;

    try {
      setIsUpdating(true);
      await adminService.updateUserStatus(targetUser._id, targetStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetUser._id ? { ...u, status: targetStatus } : u
        )
      );
      if (selectedUser?._id === targetUser._id) {
        setSelectedUser((prev) => ({ ...prev, status: targetStatus }));
      }
      setStatusModal({ isOpen: false, user: null, targetStatus: null });
      showToast(
        `User "${targetUser.name}" has been ${targetStatus === "BLOCKED" ? "blocked" : "reactivated"} successfully.`
      );
    } catch (err) {
      showToast(
        err.customMessage || err.message || "Failed to update user status.",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle Permanent Delete User
  async function handleConfirmDeleteUser() {
    const { user: targetUser } = deleteModal;
    if (!targetUser?._id) return;

    try {
      setIsDeleting(true);
      await adminService.deleteUser(targetUser._id);
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      if (selectedUser?._id === targetUser._id) {
        setSelectedUser(null);
      }
      setDeleteModal({ isOpen: false, user: null });
      showToast(`User account "${targetUser.name}" has been permanently deleted.`);
    } catch (err) {
      showToast(
        err.customMessage || err.message || "Failed to delete user account.",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // Handle email copy in details modal
  function handleCopyEmail(email) {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  }

  // Render role badge with appropriate styling
  function renderRoleBadge(role) {
    const normalized = role ? role.toUpperCase() : "CUSTOMER";
    let bg = "rgba(40, 167, 69, 0.1)";
    let color = COLORS.success;
    let border = COLORS.successBorder;
    let icon = <FaUserCheck size={11} />;
    let label = "Customer";

    if (normalized === "BUSINESS_OWNER") {
      bg = "rgba(79, 70, 229, 0.1)";
      color = COLORS.primary;
      border = "rgba(79, 70, 229, 0.3)";
      icon = <FaUserTie size={11} />;
      label = "Business Owner";
    } else if (normalized === "ADMIN") {
      bg = "rgba(217, 119, 6, 0.12)";
      color = "#D97706";
      border = "rgba(217, 119, 6, 0.35)";
      icon = <FaUserShield size={11} />;
      label = "Platform Admin";
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

  // Render status badge (ACTIVE vs BLOCKED)
  function renderStatusBadge(status) {
    const isBlocked = status === "BLOCKED";
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: isBlocked ? COLORS.dangerBg : COLORS.successBg,
          color: isBlocked ? COLORS.danger : COLORS.success,
          border: `1px solid ${isBlocked ? COLORS.dangerBorder : COLORS.successBorder}`,
          padding: "3px 9px",
          borderRadius: RADIUS.pill,
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "0.4px"
        }}
      >
        {isBlocked ? <FaBan size={10} /> : <FaCheck size={10} />}
        <span>{isBlocked ? "BLOCKED" : "ACTIVE"}</span>
      </span>
    );
  }

  // Render Role Avatar with contextual background
  function renderRoleAvatar(name, role) {
    const normalized = role ? role.toUpperCase() : "CUSTOMER";
    let bg = COLORS.success;
    if (normalized === "BUSINESS_OWNER") bg = COLORS.primary;
    if (normalized === "ADMIN") bg = "#D97706";

    return (
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: RADIUS.round,
          background: bg,
          color: COLORS.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "700",
          fontSize: "14px",
          flexShrink: 0,
          boxShadow: SHADOWS.subtle
        }}
      >
        {getInitials(name)}
      </div>
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
        <Loader size="lg" message="Loading user directory from server..." />
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
          Unable to Load User Directory
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
        <Button variant="primary" onClick={fetchUsers}>
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
          <h1
            style={{
              ...TYPOGRAPHY.h1,
              color: COLORS.secondary,
              margin: "0 0 6px"
            }}
          >
            User Directory
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              margin: 0
            }}
          >
            Monitor registered customers, business owners, and administrative accounts.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchUsers}
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
          <span>Refresh Directory</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
            ? "repeat(2, 1fr)"
            : "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        {/* Metric 1: Total Users */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
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
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Total Registered
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: COLORS.secondary,
                marginTop: "2px"
              }}
            >
              {metrics.total}
            </div>
          </div>
        </div>

        {/* Metric 2: Customers */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
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
            <FaUserCheck />
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Customers
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: COLORS.secondary,
                marginTop: "2px"
              }}
            >
              {metrics.customers}
            </div>
          </div>
        </div>

        {/* Metric 3: Business Owners */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.round,
              background: "rgba(79, 70, 229, 0.12)",
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            <FaUserTie />
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Business Owners
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: COLORS.secondary,
                marginTop: "2px"
              }}
            >
              {metrics.businessOwners}
            </div>
          </div>
        </div>

        {/* Metric 4: Platform Admins */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
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
            <FaUserShield />
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Admins
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: COLORS.secondary,
                marginTop: "2px"
              }}
            >
              {metrics.admins}
            </div>
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
        {/* Role Tab Buttons */}
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
            { id: "ALL", label: "All Users", count: metrics.total },
            { id: "CUSTOMER", label: "Customers", count: metrics.customers },
            { id: "BUSINESS_OWNER", label: "Business Owners", count: metrics.businessOwners },
            { id: "ADMIN", label: "Admins", count: metrics.admins },
            { id: "BLOCKED", label: "Suspended / Blocked", count: metrics.blocked }
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
            minWidth: isCompact ? "100%" : "280px",
            boxSizing: "border-box"
          }}
        >
          <FaSearch size={14} color={COLORS.muted} style={{ marginRight: "10px", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name or email..."
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

      {/* User Directory Content */}
      {filteredUsers.length === 0 ? (
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
            <FaUsers />
          </div>
          <h3
            style={{
              ...TYPOGRAPHY.h3,
              color: COLORS.secondary,
              margin: "0 0 8px"
            }}
          >
            No Users Found
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
              ? "No user accounts match your current search query or role filter."
              : "Zero user accounts exist on the platform currently."}
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
      ) : isCompact ? (
        /* Mobile / Tablet Card View */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "14px"
          }}
        >
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.medium,
                padding: "18px",
                boxShadow: SHADOWS.card
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {renderRoleAvatar(user.name, user.role)}
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px",
                        fontSize: "15px",
                        fontWeight: "700",
                        color: COLORS.secondary
                      }}
                    >
                      {user.name}
                    </h4>
                    <span
                      style={{
                        fontSize: "11px",
                        color: COLORS.muted,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <FaIdBadge size={10} />
                      <span>ID: {user._id?.slice(-8) || "N/A"}</span>
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                  {renderRoleBadge(user.role)}
                  {renderStatusBadge(user.status)}
                </div>
              </div>

              <div
                style={{
                  background: COLORS.surfaceSubtle,
                  borderRadius: RADIUS.small,
                  padding: "10px 14px",
                  marginBottom: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: COLORS.secondary
                  }}
                >
                  <FaEnvelope size={12} color={COLORS.muted} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {user.email}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: COLORS.textSecondary,
                    fontSize: "12px"
                  }}
                >
                  <FaCalendarAlt size={11} color={COLORS.muted} />
                  <span>Joined: {formatRegistrationDate(user.createdAt)}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(user)}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    fontSize: "13px",
                    padding: "8px 12px"
                  }}
                >
                  Inspect
                </Button>

                {!(user._id === currentAdmin?._id || user._id === currentAdmin?.id) && (
                  <>
                    {user.status === "BLOCKED" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<FaCheck size={11} />}
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            user,
                            targetStatus: "ACTIVE"
                          })
                        }
                      >
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<FaBan size={11} />}
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            user,
                            targetStatus: "BLOCKED"
                          })
                        }
                        style={{ color: COLORS.danger, borderColor: COLORS.dangerBorder }}
                      >
                        Block
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      icon={<FaTrashAlt size={11} />}
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          user
                        })
                      }
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            boxShadow: SHADOWS.card,
            overflow: "hidden"
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}
          >
            <thead>
              <tr
                style={{
                  background: COLORS.surfaceSubtle,
                  borderBottom: `1px solid ${COLORS.border}`,
                  fontSize: "12px",
                  fontWeight: "700",
                  color: COLORS.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                <th style={{ padding: "14px 20px" }}>User</th>
                <th style={{ padding: "14px 20px" }}>Email Address</th>
                <th style={{ padding: "14px 20px" }}>Account Role</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
                <th style={{ padding: "14px 20px" }}>Registration Date</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => {
                const isEven = idx % 2 === 0;
                const isCurrentAdminUser =
                  user._id === currentAdmin?._id || user._id === currentAdmin?.id;

                return (
                  <tr
                    key={user._id}
                    style={{
                      background: isEven ? COLORS.surface : COLORS.surfaceSubtle,
                      borderBottom: `1px solid ${COLORS.border}`,
                      transition: TRANSITIONS.default
                    }}
                  >
                    {/* User Profile */}
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px"
                        }}
                      >
                        {renderRoleAvatar(user.name, user.role)}
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: COLORS.secondary
                            }}
                          >
                            {user.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: COLORS.muted,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "2px"
                            }}
                          >
                            <FaIdBadge size={10} />
                            <span>ID: {user._id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: COLORS.secondary
                        }}
                      >
                        <FaEnvelope size={12} color={COLORS.muted} />
                        <span style={{ fontWeight: "500" }}>{user.email}</span>
                      </div>
                    </td>

                    {/* Role Pill */}
                    <td style={{ padding: "16px 20px" }}>
                      {renderRoleBadge(user.role)}
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: "16px 20px" }}>
                      {renderStatusBadge(user.status)}
                    </td>

                    {/* Registration Date */}
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: COLORS.textSecondary
                        }}
                      >
                        <FaCalendarAlt size={12} color={COLORS.muted} />
                        <span>{formatRegistrationDate(user.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          style={{
                            fontSize: "12px",
                            padding: "6px 12px",
                            fontWeight: "600"
                          }}
                        >
                          Inspect
                        </Button>

                        {isCurrentAdminUser ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: COLORS.muted,
                              fontStyle: "italic",
                              padding: "4px 8px"
                            }}
                          >
                            (Current Admin)
                          </span>
                        ) : (
                          <>
                            {user.status === "BLOCKED" ? (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={<FaCheck size={10} />}
                                onClick={() =>
                                  setStatusModal({
                                    isOpen: true,
                                    user,
                                    targetStatus: "ACTIVE"
                                  })
                                }
                                style={{ fontSize: "12px", padding: "6px 10px" }}
                              >
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<FaBan size={10} />}
                                onClick={() =>
                                  setStatusModal({
                                    isOpen: true,
                                    user,
                                    targetStatus: "BLOCKED"
                                  })
                                }
                                style={{
                                  fontSize: "12px",
                                  padding: "6px 10px",
                                  color: COLORS.danger,
                                  borderColor: COLORS.dangerBorder
                                }}
                              >
                                Block
                              </Button>
                            )}

                            <Button
                              variant="danger"
                              size="sm"
                              icon={<FaTrashAlt size={10} />}
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  user
                                })
                              }
                              style={{ fontSize: "12px", padding: "6px 10px" }}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Inspector Modal */}
      {selectedUser && (
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
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {renderRoleAvatar(selectedUser.name, selectedUser.role)}
                <div>
                  <h3
                    style={{
                      ...TYPOGRAPHY.h3,
                      color: COLORS.secondary,
                      margin: "0 0 4px"
                    }}
                  >
                    {selectedUser.name}
                  </h3>
                  <div>
                    {renderRoleBadge(selectedUser.role)}
                    <span style={{ marginLeft: "6px" }}>
                      {renderStatusBadge(selectedUser.status)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
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

            {/* Account Details Overview */}
            <div
              style={{
                background: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.small,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                marginBottom: "24px",
                fontSize: "13px"
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: COLORS.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px"
                  }}
                >
                  Email Address
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px"
                  }}
                >
                  <span
                    style={{
                      fontWeight: "600",
                      color: COLORS.secondary,
                      wordBreak: "break-all"
                    }}
                  >
                    {selectedUser.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(selectedUser.email)}
                    style={{
                      background: copiedEmail ? COLORS.successBg : COLORS.surface,
                      border: `1px solid ${copiedEmail ? COLORS.successBorder : COLORS.border}`,
                      color: copiedEmail ? COLORS.success : COLORS.textSecondary,
                      borderRadius: RADIUS.xs,
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0
                    }}
                  >
                    {copiedEmail ? (
                      <>
                        <FaCheck size={10} /> Copied!
                      </>
                    ) : (
                      "Copy"
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: COLORS.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px"
                  }}
                >
                  System Database ID
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: COLORS.textSecondary,
                    background: COLORS.surface,
                    padding: "6px 10px",
                    borderRadius: RADIUS.xs,
                    border: `1px solid ${COLORS.border}`
                  }}
                >
                  {selectedUser._id}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px"
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: COLORS.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "4px"
                    }}
                  >
                    Account Created
                  </div>
                  <div
                    style={{
                      color: COLORS.secondary,
                      fontWeight: "500"
                    }}
                  >
                    {formatRegistrationDate(selectedUser.createdAt)}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: COLORS.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "4px"
                    }}
                  >
                    Role Permissions
                  </div>
                  <div
                    style={{
                      color: COLORS.secondary,
                      fontWeight: "600"
                    }}
                  >
                    {selectedUser.role === "ADMIN"
                      ? "Full Administrative Access"
                      : selectedUser.role === "BUSINESS_OWNER"
                      ? "Store & Service Management"
                      : "Booking & Customer Services"}
                  </div>
                </div>
              </div>
            </div>

            {/* Note banner */}
            <div
              style={{
                background: "rgba(79, 70, 229, 0.06)",
                border: "1px solid rgba(79, 70, 229, 0.2)",
                borderRadius: RADIUS.xs,
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "12px",
                color: COLORS.textSecondary,
                lineHeight: "1.5",
                marginBottom: "24px"
              }}
            >
              <FaInfoCircle
                size={14}
                color={COLORS.primary}
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <span>
                User accounts are authenticated via HTTP-Only JWT tokens. Passwords
                are encrypted with bcrypt and excluded from administration queries.
              </span>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
              {selectedUser._id === currentAdmin?._id || selectedUser._id === currentAdmin?.id ? (
                <span style={{ fontSize: "12px", color: COLORS.muted, fontStyle: "italic" }}>
                  Active Administrator Session (Protected)
                </span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {selectedUser.status === "BLOCKED" ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<FaCheck size={11} />}
                      onClick={() =>
                        setStatusModal({
                          isOpen: true,
                          user: selectedUser,
                          targetStatus: "ACTIVE"
                        })
                      }
                    >
                      Reactivate Account
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<FaBan size={11} />}
                      onClick={() =>
                        setStatusModal({
                          isOpen: true,
                          user: selectedUser,
                          targetStatus: "BLOCKED"
                        })
                      }
                      style={{ color: COLORS.danger, borderColor: COLORS.dangerBorder }}
                    >
                      Suspend / Block
                    </Button>
                  )}

                  <Button
                    variant="danger"
                    size="sm"
                    icon={<FaTrashAlt size={11} />}
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        user: selectedUser
                      })
                    }
                  >
                    Delete Account
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                style={{ fontSize: "13px" }}
              >
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Status (Block / Unblock) Modal */}
      {statusModal.isOpen && statusModal.user && (
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
            zIndex: 10001
          }}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.modal,
              padding: isMobile ? "24px 18px" : "32px 28px",
              maxWidth: "460px",
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
                    : COLORS.dangerBg,
                color:
                  statusModal.targetStatus === "ACTIVE"
                    ? COLORS.success
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
              {statusModal.targetStatus === "BLOCKED"
                ? "Suspend User Account?"
                : "Reactivate User Account?"}
            </h3>

            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5", margin: "0 0 16px" }}>
              Are you sure you want to {statusModal.targetStatus === "BLOCKED" ? "block" : "unblock"}{" "}
              <strong>&ldquo;{statusModal.user.name}&rdquo;</strong> ({statusModal.user.email})?
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
              {statusModal.targetStatus === "BLOCKED"
                ? "Blocked users cannot log into the platform, book services, or manage existing store operations."
                : "Reactivated users regain full access to their ApnaBazar portal with their previous credentials."}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  setStatusModal({ isOpen: false, user: null, targetStatus: null })
                }
                disabled={isUpdating}
              >
                Cancel
              </Button>

              <Button
                variant={statusModal.targetStatus === "BLOCKED" ? "danger" : "primary"}
                size="md"
                onClick={handleConfirmUserStatus}
                loading={isUpdating}
                disabled={isUpdating}
              >
                {isUpdating
                  ? "Updating..."
                  : statusModal.targetStatus === "BLOCKED"
                  ? "Confirm Suspension"
                  : "Confirm Activation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete User Modal */}
      {deleteModal.isOpen && deleteModal.user && (
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
            zIndex: 10002
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
              Permanently Delete User Account?
            </h3>

            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5", margin: "0 0 16px" }}>
              Are you sure you want to permanently delete{" "}
              <strong>&ldquo;{deleteModal.user.name}&rdquo;</strong> ({deleteModal.user.email})?
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
              <strong>Irreversible Action:</strong> This user will be removed completely from MongoDB Atlas. If this user is a store owner, their business listings and services will be cascaded. If a customer, pending bookings will be automatically cancelled.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeleteModal({ isOpen: false, user: null })}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDeleteUser}
                loading={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting Account..." : "Confirm Permanent Deletion"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: toast.type === "error" ? COLORS.danger : COLORS.secondary,
            color: COLORS.white,
            padding: "12px 20px",
            borderRadius: RADIUS.medium,
            boxShadow: SHADOWS.lg,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: "600",
            zIndex: 10003
          }}
        >
          {toast.type === "error" ? <FaExclamationTriangle /> : <FaCheckCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
