import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaStore,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaGlobe,
  FaClock,
  FaStar,
  FaArrowLeft,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarPlus,
  FaInfoCircle,
  FaCrown
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
import businessService from "../../services/businessService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

function BusinessDetails() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendBlocker, setBackendBlocker] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessData() {
      if (!businessId) {
        setErrorMessage("Business ID is missing from the URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        setBackendBlocker(false);

        // Fetch business details
        const bizData = await businessService.getBusinessById(businessId);
        const biz = bizData?.business || bizData?.data || bizData;

        if (isMounted) {
          if (!biz || !biz._id) {
            setErrorMessage("Business profile not found.");
            return;
          }
          setBusiness(biz);
        }

        // Fetch business services
        try {
          const srvData = await businessService.getBusinessServices(businessId);
          if (isMounted) {
            const list = Array.isArray(srvData?.services)
              ? srvData.services
              : Array.isArray(srvData?.data)
              ? srvData.data
              : Array.isArray(srvData)
              ? srvData
              : [];
            setServices(list.filter((s) => s.isActive !== false));
          }
        } catch {
          // If services endpoint returns 404 or empty, set to empty array
          if (isMounted) {
            setServices([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404 || !err.status) {
            setBackendBlocker(true);
          } else {
            setErrorMessage(
              err.customMessage ||
                err.message ||
                "Failed to load business details from server."
            );
          }
          setBusiness(null);
          setServices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBusinessData();

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  // Format currency helper
  function formatPrice(amount) {
    if (typeof amount !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format duration helper
  function formatDuration(minutes) {
    if (!minutes) return "Duration upon request";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} hr ${rem} mins` : `${hours} hr`;
  }

  // Action to start booking flow
  function handleBookService(serviceId) {
    // Navigate to appointment booking flow (Modules 3: Day 9 & 10)
    navigate(`/book/${businessId}?serviceId=${serviceId}`);
  }

  // Strict Rule 1: Rating condition
  const hasActualRating =
    business && typeof business.rating === "number" && business.rating > 0;

  return (
    <div
      style={{
        maxWidth: PAGE_WIDTH,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 64px" : "40px 28px 80px",
        boxSizing: "border-box"
      }}
    >
      {/* Top Breadcrumb & Back Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px"
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          icon={<FaArrowLeft />}
          onClick={() => navigate("/explore")}
        >
          Back to Directory
        </Button>

        <div style={{ fontSize: "13px", color: COLORS.muted }}>
          <Link to="/" style={{ color: COLORS.muted, textDecoration: "none" }}>
            Home
          </Link>{" "}
          /{" "}
          <Link to="/explore" style={{ color: COLORS.muted, textDecoration: "none" }}>
            Explore
          </Link>{" "}
          / <span style={{ color: COLORS.primaryDark, fontWeight: "600" }}>{business?.name || "Business Details"}</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. LOADING STATE */}
      {/* ============================================================== */}
      {loading && (
        <div
          style={{
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <Loader size={46} text="Fetching real merchant profile and service catalog..." />
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. BACKEND BLOCKER / API AWAITING STATE */}
      {/* ============================================================== */}
      {!loading && backendBlocker && (
        <div
          style={{
            background: COLORS.surface,
            border: `1px dashed ${COLORS.warningBorder}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "44px 20px" : "64px 32px",
            textAlign: "center",
            maxWidth: "680px",
            margin: "20px auto 0"
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: RADIUS.round,
              background: COLORS.warningBg,
              color: COLORS.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 18px"
            }}
          >
            <FaExclamationTriangle />
          </div>

          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: COLORS.secondary,
              margin: "0 0 10px"
            }}
          >
            Public Business Detail Endpoint Awaiting Backend Connection
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              lineHeight: "1.6",
              margin: "0 0 20px"
            }}
          >
            The route <code>GET /api/business/{businessId}</code> and service listing are required to
            serve dynamic MongoDB records. Under APNA-BAZAR strict real-data rules,
            no fake business details or mock services are shown.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: COLORS.infoBg,
              color: "#1E40AF",
              border: `1px solid ${COLORS.infoBorder}`,
              padding: "10px 16px",
              borderRadius: RADIUS.small,
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "24px"
            }}
          >
            <FaInfoCircle />
            <span>Real Data Only: Live database connection required</span>
          </div>

          <div>
            <Button
              variant="outline"
              onClick={() => navigate("/explore")}
              icon={<FaArrowLeft />}
            >
              Back to Explore Directory
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ERROR NOT FOUND STATE */}
      {/* ============================================================== */}
      {!loading && !backendBlocker && errorMessage && (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "40px 20px" : "60px 32px",
            textAlign: "center",
            maxWidth: "580px",
            margin: "20px auto 0"
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: RADIUS.round,
              background: COLORS.dangerBg,
              color: COLORS.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 18px"
            }}
          >
            <FaExclamationTriangle />
          </div>

          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: COLORS.secondary,
              margin: "0 0 10px"
            }}
          >
            {errorMessage}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              lineHeight: "1.6",
              margin: "0 0 24px"
            }}
          >
            Please check the business link or browse our directory of verified local merchants.
          </p>

          <Button
            variant="primary"
            onClick={() => navigate("/explore")}
          >
            Explore Verified Businesses
          </Button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. REAL BUSINESS PROFILE & SERVICES LAYOUT */}
      {/* ============================================================== */}
      {!loading && !backendBlocker && business && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isCompact ? "1fr" : "1fr 340px",
            gap: "32px",
            alignItems: "start"
          }}
        >
          {/* Left Column: Business Overview & Services List */}
          <div>
            {/* Business Header Card */}
            <div
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.large,
                boxShadow: SHADOWS.card,
                padding: isMobile ? "24px 18px" : "36px 32px",
                marginBottom: "32px"
              }}
            >
              {/* Category & Status Badges */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      background: COLORS.primaryBg,
                      color: COLORS.primaryDark,
                      borderRadius: RADIUS.xs,
                      fontSize: "12px",
                      fontWeight: "700",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase"
                    }}
                  >
                    {business.category}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 10px",
                      background: COLORS.successBg,
                      color: COLORS.success,
                      borderRadius: RADIUS.pill,
                      fontSize: "11px",
                      fontWeight: "700"
                    }}
                  >
                    <FaCheckCircle size={11} /> Verified Active Merchant
                  </span>

                  {business.subscriptionTier === "PREMIUM" && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                        color: "#B45309",
                        border: "1px solid #FCD34D",
                        borderRadius: RADIUS.pill,
                        fontSize: "11px",
                        fontWeight: "800"
                      }}
                    >
                      <FaCrown size={11} color="#D97706" /> Premium Elite Partner
                    </span>
                  )}

                  {business.subscriptionTier === "PRO" && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        background: "rgba(79, 70, 229, 0.1)",
                        color: COLORS.primary,
                        border: "1px solid rgba(79, 70, 229, 0.3)",
                        borderRadius: RADIUS.pill,
                        fontSize: "11px",
                        fontWeight: "800"
                      }}
                    >
                      <FaCheckCircle size={11} color={COLORS.primary} /> Verified Pro Business
                    </span>
                  )}
                </div>

                {/* Rating Badge: Strictly shows real rating if > 0 */}
                {hasActualRating ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: COLORS.warningBg,
                      color: "#9A6200",
                      border: `1px solid ${COLORS.warningBorder}`,
                      padding: "4px 10px",
                      borderRadius: RADIUS.pill,
                      fontSize: "13px",
                      fontWeight: "700"
                    }}
                  >
                    <FaStar color={COLORS.warning} size={12} />
                    <span>{business.rating.toFixed(1)} / 5</span>
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: "12px",
                      color: COLORS.muted,
                      background: COLORS.surfaceSubtle,
                      padding: "4px 10px",
                      borderRadius: RADIUS.pill,
                      border: `1px solid ${COLORS.border}`
                    }}
                  >
                    New Merchant (No reviews yet)
                  </span>
                )}
              </div>

              {/* Business Name */}
              <h1
                style={{
                  ...TYPOGRAPHY.h2,
                  color: COLORS.secondary,
                  margin: "0 0 14px",
                  fontSize: isMobile ? "24px" : "32px"
                }}
              >
                {business.name}
              </h1>

              {/* Description */}
              {business.description && (
                <p
                  style={{
                    fontSize: "15px",
                    color: COLORS.textSecondary,
                    lineHeight: "1.7",
                    margin: "0 0 24px"
                  }}
                >
                  {business.description}
                </p>
              )}

              {/* Quick Details Chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  paddingTop: "20px",
                  borderTop: `1px solid ${COLORS.border}`,
                  fontSize: "14px",
                  color: COLORS.muted
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaMapMarkerAlt color={COLORS.primary} />
                  <span>
                    {business.address}, {business.city}
                  </span>
                </div>

                {business.openingHours && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaClock color={COLORS.primary} />
                    <span>{business.openingHours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Services Catalog Section */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px"
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: "800",
                      color: COLORS.secondary,
                      margin: "0 0 4px"
                    }}
                  >
                    Available Services & Pricing
                  </h2>
                  <p style={{ fontSize: "14px", color: COLORS.muted, margin: 0 }}>
                    Select a service to proceed with your booking.
                  </p>
                </div>

                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: COLORS.primaryDark,
                    background: COLORS.primaryBg,
                    padding: "4px 10px",
                    borderRadius: RADIUS.pill
                  }}
                >
                  {services.length} {services.length === 1 ? "Service" : "Services"}
                </span>
              </div>

              {/* Services Grid */}
              {services.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {services.map((srv) => (
                    <div
                      key={srv._id}
                      style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: RADIUS.medium,
                        boxShadow: SHADOWS.card,
                        padding: isMobile ? "18px 16px" : "22px 24px",
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "flex-start" : "center",
                        justifyContent: "space-between",
                        gap: "18px",
                        transition: `all ${TRANSITIONS.fast}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = COLORS.borderFocus;
                        e.currentTarget.style.boxShadow = SHADOWS.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.border;
                        e.currentTarget.style.boxShadow = SHADOWS.card;
                      }}
                    >
                      {/* Service Info */}
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "17px",
                            fontWeight: "700",
                            color: COLORS.secondary,
                            margin: "0 0 6px"
                          }}
                        >
                          {srv.name}
                        </h3>

                        {srv.description && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: COLORS.muted,
                              lineHeight: "1.5",
                              margin: "0 0 10px"
                            }}
                          >
                            {srv.description}
                          </p>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            fontSize: "13px"
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              color: COLORS.textSecondary,
                              fontWeight: "500"
                            }}
                          >
                            <FaClock color={COLORS.muted} size={12} />
                            {formatDuration(srv.duration)}
                          </span>

                          <span
                            style={{
                              fontSize: "16px",
                              fontWeight: "800",
                              color: COLORS.primaryDark
                            }}
                          >
                            {formatPrice(srv.price)}
                          </span>
                        </div>
                      </div>

                      {/* Book Button */}
                      <div>
                        <Button
                          variant="primary"
                          size="md"
                          icon={<FaCalendarPlus />}
                          onClick={() => handleBookService(srv._id)}
                        >
                          Book Service
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty Services State */
                <div
                  style={{
                    background: COLORS.surfaceSubtle,
                    border: `1px dashed ${COLORS.borderDark}`,
                    borderRadius: RADIUS.medium,
                    padding: "36px 20px",
                    textAlign: "center"
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: RADIUS.round,
                      background: COLORS.primaryBg,
                      color: COLORS.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      margin: "0 auto 12px"
                    }}
                  >
                    <FaStore />
                  </div>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: COLORS.secondary,
                      margin: "0 0 6px"
                    }}
                  >
                    No Services Listed Yet
                  </h4>
                  <p style={{ fontSize: "13px", color: COLORS.muted, margin: 0 }}>
                    This business has not published any active services yet. Please check back later.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Contact & Merchant Summary Card */}
          <div
            style={{
              position: isCompact ? "static" : "sticky",
              top: "90px"
            }}
          >
            <div
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.large,
                boxShadow: SHADOWS.card,
                padding: "28px 24px"
              }}
            >
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: COLORS.secondary,
                  margin: "0 0 16px",
                  paddingBottom: "12px",
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                Contact & Location
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                {/* Address */}
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: COLORS.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "4px"
                    }}
                  >
                    Address
                  </span>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: COLORS.text }}>
                    <FaMapMarkerAlt color={COLORS.primary} size={14} style={{ marginTop: "3px", flexShrink: 0 }} />
                    <span style={{ lineHeight: "1.4" }}>
                      {business.address}, {business.city}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                {business.contactNumber && (
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: COLORS.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: "4px"
                      }}
                    >
                      Phone Number
                    </span>
                    <a
                      href={`tel:${business.contactNumber}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: COLORS.primary,
                        textDecoration: "none",
                        fontWeight: "600"
                      }}
                    >
                      <FaPhoneAlt size={12} />
                      {business.contactNumber}
                    </a>
                  </div>
                )}

                {/* Website */}
                {business.website && (
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: COLORS.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: "4px"
                      }}
                    >
                      Website
                    </span>
                    <a
                      href={
                        business.website.startsWith("http")
                          ? business.website
                          : `https://${business.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: COLORS.primary,
                        textDecoration: "none",
                        fontWeight: "600",
                        wordBreak: "break-all"
                      }}
                    >
                      <FaGlobe size={13} />
                      {business.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                {/* Operating Hours */}
                {business.openingHours && (
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: COLORS.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: "4px"
                      }}
                    >
                      Operating Hours
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.text }}>
                      <FaClock color={COLORS.muted} size={13} />
                      <span>{business.openingHours}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Book Appointment CTA in sidebar */}
              {services.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<FaCalendarPlus />}
                    onClick={() => navigate(`/book/${businessId}`)}
                    style={{ width: "100%" }}
                  >
                    Book an Appointment
                  </Button>
                </div>
              )}

              {/* Safety & Trust Badge */}
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${COLORS.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                  color: COLORS.muted
                }}
              >
                <FaShieldAlt color={COLORS.primary} size={16} />
                <span>Verified business listing on APNA-BAZAR marketplace.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessDetails;
