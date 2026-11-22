import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaSearch,
  FaRedoAlt,
  FaReceipt,
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
import paymentService from "../../services/paymentService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

// Pure date formatting helper
function formatTxnDate(dateString) {
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

function AdminTransactions() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    proCount: 0,
    premiumCount: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filters & Search
  const [activePlanFilter, setActivePlanFilter] = useState("ALL"); // ALL | PRO | PREMIUM
  const [searchQuery, setSearchQuery] = useState("");

  // Receipt Modal
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Load transactions
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        const res = await paymentService.getAdminTransactions();
        if (isMounted) {
          setTransactions(Array.isArray(res?.transactions) ? res.transactions : []);
          if (res?.metrics) {
            setMetrics(res.metrics);
          }
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err.customMessage || err.message || "Failed to load transaction records."
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
  const refreshTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await paymentService.getAdminTransactions();
      setTransactions(Array.isArray(res?.transactions) ? res.transactions : []);
      if (res?.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      setLoadError(
        err.customMessage || err.message || "Failed to refresh transaction records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (activePlanFilter === "ALL") return true;
        return t.plan === activePlanFilter;
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const bizName = t.businessId?.name?.toLowerCase() || "";
        const ownerEmail = t.ownerId?.email?.toLowerCase() || "";
        const txnId = t.transactionId?.toLowerCase() || "";
        return bizName.includes(q) || ownerEmail.includes(q) || txnId.includes(q);
      });
  }, [transactions, activePlanFilter, searchQuery]);

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
        <Loader size="lg" message="Loading platform transaction ledger..." />
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
          Unable to Load Transactions
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={refreshTransactions}>
          Retry Connection
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
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        <div>
          <h1 style={{ ...TYPOGRAPHY.h1, color: COLORS.secondary, margin: "0 0 6px" }}>
            Platform Revenue &amp; Subscriptions
          </h1>
          <p style={{ fontSize: "14px", color: COLORS.textSecondary, margin: 0 }}>
            Audit all merchant subscription upgrades, Pro/Premium revenue, and payment invoices.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={refreshTransactions}
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
          <span>Refresh Ledger</span>
        </Button>
      </div>

      {/* KPI Cards */}
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
        {/* Metric 1: Total Revenue */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.muted, textTransform: "uppercase" }}>
            Total Subscription Revenue
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.primary, marginTop: "4px" }}>
            {formatCurrency(metrics.totalRevenue)}
          </div>
        </div>

        {/* Metric 2: Active Pro */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.primary, textTransform: "uppercase" }}>
            Active Pro Merchants
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "4px" }}>
            {metrics.proCount}
          </div>
        </div>

        {/* Metric 3: Active Premium */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#D97706", textTransform: "uppercase" }}>
            Active Premium Merchants
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#D97706", marginTop: "4px" }}>
            {metrics.premiumCount}
          </div>
        </div>

        {/* Metric 4: Total Transactions */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px",
            boxShadow: SHADOWS.card
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.muted, textTransform: "uppercase" }}>
            Total Transactions
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "4px" }}>
            {metrics.totalTransactions}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          padding: "16px 20px",
          boxShadow: SHADOWS.card,
          marginBottom: "24px",
          display: "flex",
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "stretch" : "center",
          justifyContent: "space-between",
          gap: "16px"
        }}
      >
        {/* Plan Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["ALL", "PRO", "PREMIUM"].map((p) => {
            const isSel = activePlanFilter === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActivePlanFilter(p)}
                style={{
                  background: isSel ? COLORS.secondary : COLORS.surfaceSubtle,
                  color: isSel ? COLORS.white : COLORS.textSecondary,
                  border: `1px solid ${isSel ? COLORS.secondary : COLORS.border}`,
                  padding: "6px 14px",
                  borderRadius: RADIUS.pill,
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: TRANSITIONS.default
                }}
              >
                {p === "ALL" ? "All Plans" : p}
              </button>
            );
          })}
        </div>

        {/* Search */}
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
          <FaSearch size={13} color={COLORS.muted} style={{ marginRight: "10px", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search business, email, or transaction ID..."
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
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "50px 24px",
            textAlign: "center",
            boxShadow: SHADOWS.card
          }}
        >
          <FaReceipt size={32} color={COLORS.muted} style={{ marginBottom: "12px" }} />
          <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
            No Transactions Found
          </h3>
          <p style={{ fontSize: "14px", color: COLORS.textSecondary, margin: 0 }}>
            {searchQuery || activePlanFilter !== "ALL"
              ? "No payment records match your active search or filter."
              : "Zero subscription transactions processed on the platform yet."}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            boxShadow: SHADOWS.card,
            overflow: "hidden"
          }}
        >
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
                  <th style={{ padding: "14px 18px" }}>Date</th>
                  <th style={{ padding: "14px 18px" }}>Business</th>
                  <th style={{ padding: "14px 18px" }}>Owner</th>
                  <th style={{ padding: "14px 18px" }}>Plan</th>
                  <th style={{ padding: "14px 18px" }}>Cycle</th>
                  <th style={{ padding: "14px 18px" }}>Method</th>
                  <th style={{ padding: "14px 18px" }}>Amount</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, idx) => (
                  <tr
                    key={t._id || idx}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: idx % 2 === 0 ? COLORS.surface : COLORS.surfaceSubtle
                    }}
                  >
                    <td style={{ padding: "14px 18px", color: COLORS.secondary, whiteSpace: "nowrap" }}>
                      {formatTxnDate(t.createdAt || t.startDate)}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: "700", color: COLORS.secondary }}>
                        {t.businessId?.name || "Business"}
                      </div>
                      <div style={{ fontSize: "11px", color: COLORS.muted }}>
                        {t.businessId?.city ? `${t.businessId.city} • ` : ""}
                        {t.businessId?.category}
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ color: COLORS.secondary, fontWeight: "500" }}>{t.ownerId?.name || "Owner"}</div>
                      <div style={{ fontSize: "11px", color: COLORS.muted }}>{t.ownerId?.email}</div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          background: t.plan === "PREMIUM" ? "rgba(217, 119, 6, 0.12)" : "rgba(79, 70, 229, 0.1)",
                          color: t.plan === "PREMIUM" ? "#D97706" : COLORS.primary,
                          borderRadius: RADIUS.pill,
                          padding: "2px 8px",
                          fontSize: "11px",
                          fontWeight: "800"
                        }}
                      >
                        {t.plan}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", color: COLORS.textSecondary }}>
                      {t.billingCycle}
                    </td>

                    <td style={{ padding: "14px 18px", color: COLORS.secondary }}>
                      {t.paymentMethod}
                    </td>

                    <td style={{ padding: "14px 18px", fontWeight: "800", color: COLORS.secondary }}>
                      {formatCurrency(t.amount)}
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTxn(t)}
                        style={{ fontSize: "12px", padding: "4px 10px" }}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTxn && (
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
              maxWidth: "500px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: 0 }}>
                Transaction Audit
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
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
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "13px",
                marginBottom: "24px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Transaction ID:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{selectedTxn.transactionId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Business Name:</span>
                <span style={{ fontWeight: "700" }}>{selectedTxn.businessId?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Merchant Email:</span>
                <span>{selectedTxn.ownerId?.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Subscribed Plan:</span>
                <span style={{ fontWeight: "700", color: COLORS.primary }}>
                  {selectedTxn.plan} ({selectedTxn.billingCycle})
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Payment Method:</span>
                <span>{selectedTxn.paymentMethod}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Amount Paid:</span>
                <span style={{ fontWeight: "800", color: COLORS.secondary }}>
                  {formatCurrency(selectedTxn.amount)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.muted }}>Valid Until:</span>
                <span>{formatTxnDate(selectedTxn.endDate)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedTxn(null)}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Close Record
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTransactions;
