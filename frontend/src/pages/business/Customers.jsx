import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaUsers,
  FaCalendarCheck,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaRedoAlt,
  FaCalendarAlt,
  FaTimes,
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
function formatLastBookingDate(dateString) {
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
  if (!name) return "C";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function BusinessCustomers() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Data fetching state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Load customers
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        const res = await businessService.getCustomers();
        const list = Array.isArray(res?.customers) ? res.customers : [];
        if (isMounted) {
          setCustomers(list);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err.customMessage ||
              err.message ||
              "Failed to load customer list."
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
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await businessService.getCustomers();
      const list = Array.isArray(res?.customers) ? res.customers : [];
      setCustomers(list);
    } catch (err) {
      setLoadError(
        err.customMessage ||
          err.message ||
          "Failed to load customer list."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Metrics
  const metrics = useMemo(() => {
    const totalUnique = customers.length;
    let totalAppointments = 0;
    customers.forEach((c) => {
      totalAppointments += c.totalAppointments || 0;
    });
    return { totalUnique, totalAppointments };
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((entry) => {
      const name = entry.customer?.name?.toLowerCase() || "";
      const email = entry.customer?.email?.toLowerCase() || "";
      const phone = entry.customer?.phone?.toLowerCase() || "";
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [customers, searchQuery]);

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
        <Loader size="lg" message="Loading your customer directory..." />
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
          Unable to Load Customers
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
        <Button variant="primary" onClick={fetchCustomers}>
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
            My Customers
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              margin: 0
            }}
          >
            Review customer contact records and appointment history for your business.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchCustomers}
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
          <span>Refresh List</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: "18px",
          marginBottom: "28px"
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "22px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: RADIUS.round,
              background: "rgba(79, 70, 229, 0.1)",
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0
            }}
          >
            <FaUsers />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: COLORS.muted, textTransform: "uppercase" }}>
              Total Unique Customers
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
              {metrics.totalUnique}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "22px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: RADIUS.round,
              background: COLORS.successBg,
              color: COLORS.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0
            }}
          >
            <FaCalendarCheck />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: COLORS.muted, textTransform: "uppercase" }}>
              Total Appointments Served
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
              {metrics.totalAppointments}
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          padding: "16px 20px",
          boxShadow: SHADOWS.card,
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <FaSearch size={14} color={COLORS.muted} style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by customer name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "14px",
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
            <FaTimes size={13} />
          </button>
        )}
      </div>

      {/* Customer Directory Content */}
      {filteredCustomers.length === 0 ? (
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
          <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
            No Customers Found
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              maxWidth: "420px",
              margin: "0 auto 20px"
            }}
          >
            {searchQuery
              ? "No customer records match your search query."
              : "Customers who book appointments with your business will appear here."}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              style={{ fontSize: "13px" }}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : isCompact ? (
        /* Mobile / Tablet Cards */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "14px"
          }}
        >
          {filteredCustomers.map((entry, idx) => (
            <div
              key={entry.customer?._id || idx}
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
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px"
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: RADIUS.round,
                    background: COLORS.primary,
                    color: COLORS.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "14px",
                    flexShrink: 0
                  }}
                >
                  {getInitials(entry.customer?.name)}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "700", color: COLORS.secondary }}>
                    {entry.customer?.name || "Customer Account Deleted"}
                  </h4>
                  <span style={{ fontSize: "11px", color: COLORS.muted }}>
                    ID: {entry.customer?._id?.slice(-8) || "N/A"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: COLORS.surfaceSubtle,
                  borderRadius: RADIUS.small,
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  marginBottom: "12px"
                }}
              >
                {entry.customer?.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.secondary }}>
                    <FaEnvelope size={12} color={COLORS.muted} />
                    <span>{entry.customer.email}</span>
                  </div>
                )}
                {entry.customer?.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.secondary }}>
                    <FaPhone size={12} color={COLORS.muted} />
                    <span>{entry.customer.phone}</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: COLORS.textSecondary,
                  borderTop: `1px solid ${COLORS.border}`,
                  paddingTop: "10px"
                }}
              >
                <span>
                  Bookings: <strong>{entry.totalAppointments}</strong>
                </span>
                <span>
                  Last: <strong>{formatLastBookingDate(entry.lastAppointment)}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table */
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
                <th style={{ padding: "14px 20px" }}>Customer Name</th>
                <th style={{ padding: "14px 20px" }}>Email</th>
                <th style={{ padding: "14px 20px" }}>Phone</th>
                <th style={{ padding: "14px 20px" }}>Total Bookings</th>
                <th style={{ padding: "14px 20px" }}>Last Appointment</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((entry, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={entry.customer?._id || idx}
                    style={{
                      background: isEven ? COLORS.surface : COLORS.surfaceSubtle,
                      borderBottom: `1px solid ${COLORS.border}`,
                      transition: TRANSITIONS.default
                    }}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: RADIUS.round,
                            background: COLORS.primary,
                            color: COLORS.white,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "13px",
                            flexShrink: 0
                          }}
                        >
                          {getInitials(entry.customer?.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: COLORS.secondary }}>
                            {entry.customer?.name || "Customer Account Deleted"}
                          </div>
                          <div style={{ fontSize: "11px", color: COLORS.muted }}>
                            ID: {entry.customer?._id || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px", fontSize: "13px", color: COLORS.secondary }}>
                      {entry.customer?.email || "—"}
                    </td>

                    <td style={{ padding: "16px 20px", fontSize: "13px", color: COLORS.secondary }}>
                      {entry.customer?.phone || "—"}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          background: "rgba(79, 70, 229, 0.1)",
                          color: COLORS.primary,
                          border: "1px solid rgba(79, 70, 229, 0.3)",
                          padding: "3px 10px",
                          borderRadius: RADIUS.pill,
                          fontSize: "12px",
                          fontWeight: "700"
                        }}
                      >
                        {entry.totalAppointments} {entry.totalAppointments === 1 ? "booking" : "bookings"}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px", fontSize: "13px", color: COLORS.textSecondary }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaCalendarAlt size={11} color={COLORS.muted} />
                        <span>{formatLastBookingDate(entry.lastAppointment)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BusinessCustomers;
