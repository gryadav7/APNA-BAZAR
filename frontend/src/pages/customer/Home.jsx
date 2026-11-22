import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCut,
  FaHeartbeat,
  FaDumbbell,
  FaUtensils,
  FaCar,
  FaGraduationCap,
  FaTools,
  FaBriefcase,
  FaCalendarCheck,
  FaCheckCircle,
  FaArrowRight,
  FaStore,
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
import businessService from "../../services/businessService";
import BusinessCard from "../../components/BusinessCard";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

function Home() {
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const isCompact = isMobile || isTablet;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  // Real backend business data state
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Core Service Categories
  const categories = [
    {
      name: "Salon & Beauty",
      icon: <FaCut />,
      desc: "Haircut, styling, spa & makeup"
    },
    {
      name: "Healthcare",
      icon: <FaHeartbeat />,
      desc: "Clinics, dental & specialists"
    },
    {
      name: "Fitness & Gym",
      icon: <FaDumbbell />,
      desc: "Personal trainers, yoga & fitness"
    },
    {
      name: "Restaurants & Cafes",
      icon: <FaUtensils />,
      desc: "Local dining, bakers & snacks"
    },
    {
      name: "Home Services",
      icon: <FaTools />,
      desc: "Plumbing, electrical & repairs"
    },
    {
      name: "Automobile Care",
      icon: <FaCar />,
      desc: "Car wash, detailing & mechanic"
    },
    {
      name: "Education & Classes",
      icon: <FaGraduationCap />,
      desc: "Tuitions, coaching & hobby"
    },
    {
      name: "Professional",
      icon: <FaBriefcase />,
      desc: "Legal, accounting & consulting"
    }
  ];

  // How it works steps
  const steps = [
    {
      number: "01",
      title: "Find Local Services",
      desc: "Search verified local businesses, services, and neighborhood providers by name, category, or city.",
      icon: <FaSearch color={COLORS.primary} size={24} />
    },
    {
      number: "02",
      title: "Select Convenient Slot",
      desc: "Browse real operating days and choose a time that perfectly matches your schedule.",
      icon: <FaCalendarCheck color={COLORS.primary} size={24} />
    },
    {
      number: "03",
      title: "Confirm & Track",
      desc: "Reserve your appointment instantly and view real-time booking status right in your customer dashboard.",
      icon: <FaCheckCircle color={COLORS.primary} size={24} />
    }
  ];

  // Load real featured businesses from MongoDB backend
  useEffect(() => {
    let isMounted = true;

    async function fetchFeatured() {
      try {
        setLoadingBusinesses(true);
        setApiError(null);
        const data = await businessService.getFeaturedBusinesses(4);

        if (isMounted) {
          const list =
            Array.isArray(data?.businesses)
              ? data.businesses
              : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
              ? data
              : [];
          setFeaturedBusinesses(list);
        }
      } catch (err) {
        if (isMounted) {
          setApiError(
            err.customMessage ||
              err.message ||
              "Unable to connect to business service"
          );
          setFeaturedBusinesses([]);
        }
      } finally {
        if (isMounted) {
          setLoadingBusinesses(false);
        }
      }
    }

    fetchFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("query", searchQuery.trim());
    if (cityQuery.trim()) params.set("city", cityQuery.trim());
    navigate(`/explore?${params.toString()}`);
  }

  function handleCategoryClick(categoryName) {
    navigate(`/explore?category=${encodeURIComponent(categoryName)}`);
  }

  return (
    <div style={{ color: COLORS.text, background: COLORS.background }}>
      {/* ============================================================== */}
      {/* 1. HERO SECTION */}
      {/* ============================================================== */}
      <section
        style={{
          background: "linear-gradient(135deg, #F0EFFF 0%, #F8F8FC 60%, #EEF5FF 100%)",
          padding: isMobile ? "40px 20px" : isTablet ? "56px 28px" : "80px 32px",
          borderBottom: `1px solid ${COLORS.border}`
        }}
      >
        <div
          style={{
            maxWidth: PAGE_WIDTH,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isCompact ? "1fr" : "1.15fr 0.85fr",
            gap: isCompact ? "36px" : "48px",
            alignItems: "center"
          }}
        >
          {/* Left Column: Heading & Value Proposition */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                background: COLORS.white,
                borderRadius: RADIUS.pill,
                boxShadow: SHADOWS.sm,
                border: `1px solid ${COLORS.border}`,
                marginBottom: "20px"
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: RADIUS.round,
                  background: COLORS.success,
                  display: "inline-block"
                }}
              />
              <span
                style={{
                  color: COLORS.primaryDark,
                  fontWeight: "700",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase"
                }}
              >
                Local Business Discovery & Booking
              </span>
            </div>

            <h1
              style={{
                ...TYPOGRAPHY.h1,
                color: COLORS.secondary,
                margin: "0 0 18px",
                letterSpacing: "-0.025em"
              }}
            >
              Discover Local Services.{" "}
              <span style={{ color: COLORS.primary }}>
                Book Appointments Easily.
              </span>
            </h1>

            <p
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.muted,
                margin: "0 0 28px",
                maxWidth: "520px",
                fontSize: isMobile ? "15px" : "17px",
                lineHeight: "1.7"
              }}
            >
              Find trusted local businesses, explore transparent service pricing,
              and secure your appointment without waiting in queues.
            </p>

            {/* Quick Action Buttons */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "36px"
              }}
            >
              <Button
                variant="primary"
                size="lg"
                icon={<FaArrowRight />}
                iconPosition="right"
                onClick={() => navigate("/explore")}
              >
                Explore Businesses
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/register")}
              >
                Join as Business Owner
              </Button>
            </div>

            {/* Trust Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
                gap: "16px",
                paddingTop: "24px",
                borderTop: `1px solid ${COLORS.border}`
              }}
            >
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "20px",
                    fontWeight: "800",
                    color: COLORS.secondary
                  }}
                >
                  100% Real
                </strong>
                <span style={{ fontSize: "12px", color: COLORS.muted }}>
                  Verified Local Merchants
                </span>
              </div>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "20px",
                    fontWeight: "800",
                    color: COLORS.primary
                  }}
                >
                  Direct Booking
                </strong>
                <span style={{ fontSize: "12px", color: COLORS.muted }}>
                  No Middleman Fees
                </span>
              </div>

              {!isMobile && (
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "20px",
                      fontWeight: "800",
                      color: COLORS.success
                    }}
                  >
                    Real-Time
                  </strong>
                  <span style={{ fontSize: "12px", color: COLORS.muted }}>
                    Live Appointment Status
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Search Card */}
          <div
            style={{
              background: COLORS.surface,
              padding: isMobile ? "24px" : "32px",
              borderRadius: RADIUS.large,
              boxShadow: SHADOWS.elevated,
              border: `1px solid ${COLORS.border}`,
              boxSizing: "border-box"
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: COLORS.secondary,
                  margin: "0 0 6px"
                }}
              >
                Search Nearby Services
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: COLORS.muted,
                  margin: 0
                }}
              >
                Find local salons, dentists, workshops & more in your city.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit}>
              {/* Keyword Input */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: COLORS.textSecondary,
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em"
                  }}
                >
                  Service or Business Name
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "13px 16px",
                    background: COLORS.surfaceSubtle,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.small,
                    transition: `border-color ${TRANSITIONS.fast}`
                  }}
                >
                  <FaSearch color={COLORS.primary} size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Haircut, Dental Clinic, Car Wash..."
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "14px",
                      color: COLORS.text,
                      fontFamily: "inherit"
                    }}
                  />
                </div>
              </div>

              {/* City Input */}
              <div style={{ marginBottom: "22px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: COLORS.textSecondary,
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em"
                  }}
                >
                  Location or City
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "13px 16px",
                    background: COLORS.surfaceSubtle,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.small,
                    transition: `border-color ${TRANSITIONS.fast}`
                  }}
                >
                  <FaMapMarkerAlt color={COLORS.primary} size={15} />
                  <input
                    type="text"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bengaluru..."
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "14px",
                      color: COLORS.text,
                      fontFamily: "inherit"
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                icon={<FaSearch />}
              >
                Search Available Services
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. CATEGORIES SECTION */}
      {/* ============================================================== */}
      <section
        id="categories"
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isMobile ? "48px 20px" : isTablet ? "64px 28px" : "80px 32px",
          boxSizing: "border-box"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span
            style={{
              color: COLORS.primary,
              fontWeight: "700",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            Diverse Local Services
          </span>
          <h2
            style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.secondary,
              margin: "8px 0"
            }}
          >
            Explore Popular Categories
          </h2>
          <p
            style={{
              ...TYPOGRAPHY.body,
              color: COLORS.muted,
              maxWidth: "500px",
              margin: "0 auto"
            }}
          >
            Find exactly what you need from verified service providers in your neighborhood.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr 1fr"
              : isTablet
              ? "repeat(3, 1fr)"
              : "repeat(4, 1fr)",
            gap: isMobile ? "14px" : "20px"
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCategoryClick(cat.name);
                }
              }}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.medium,
                padding: isMobile ? "20px 14px" : "26px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: `all ${TRANSITIONS.fast}`,
                boxShadow: SHADOWS.sm,
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = SHADOWS.hover;
                e.currentTarget.style.borderColor = COLORS.borderFocus;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = SHADOWS.sm;
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: RADIUS.small,
                  background: COLORS.primaryBg,
                  color: COLORS.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "14px"
                }}
              >
                {cat.icon}
              </div>

              <strong
                style={{
                  fontSize: isMobile ? "14px" : "15px",
                  color: COLORS.secondary,
                  marginBottom: "6px"
                }}
              >
                {cat.name}
              </strong>

              <span
                style={{
                  fontSize: "12px",
                  color: COLORS.muted,
                  lineHeight: "1.4"
                }}
              >
                {cat.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. FEATURED BUSINESSES SECTION (STRICT REAL DATA COMPLIANT) */}
      {/* ============================================================== */}
      <section
        style={{
          background: COLORS.surface,
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: isMobile ? "48px 20px" : isTablet ? "64px 28px" : "80px 32px"
        }}
      >
        <div
          style={{
            maxWidth: PAGE_WIDTH,
            margin: "0 auto",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "flex-end",
              gap: "16px",
              marginBottom: "36px"
            }}
          >
            <div>
              <span
                style={{
                  color: COLORS.primary,
                  fontWeight: "700",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}
              >
                Real Database Records
              </span>
              <h2
                style={{
                  ...TYPOGRAPHY.h2,
                  color: COLORS.secondary,
                  margin: "6px 0 0"
                }}
              >
                Featured Local Businesses
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<FaArrowRight />}
              iconPosition="right"
              onClick={() => navigate("/explore")}
            >
              Browse Directory
            </Button>
          </div>

          {/* Real Backend Data Loading State */}
          {loadingBusinesses && (
            <div
              style={{
                padding: "64px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Loader text="Fetching registered local merchants from database..." />
            </div>
          )}

          {/* Real Backend Data Display (ONLY IF REAL BUSINESSES EXIST) */}
          {!loadingBusinesses && featuredBusinesses.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                  ? "1fr 1fr"
                  : "repeat(4, 1fr)",
                gap: "24px"
              }}
            >
              {featuredBusinesses.map((biz) => (
                <BusinessCard key={biz._id} business={biz} />
              ))}
            </div>
          )}

          {/* Empty or Backend Blocker State (STRICT REAL DATA COMPLIANCE) */}
          {!loadingBusinesses && featuredBusinesses.length === 0 && (
            <div
              style={{
                background: COLORS.surfaceSubtle,
                border: `1px dashed ${COLORS.borderDark}`,
                borderRadius: RADIUS.medium,
                padding: isMobile ? "36px 20px" : "48px 32px",
                textAlign: "center",
                maxWidth: "680px",
                margin: "0 auto"
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: RADIUS.round,
                  background: COLORS.lightPurple,
                  color: COLORS.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  margin: "0 auto 16px"
                }}
              >
                <FaStore />
              </div>

              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: COLORS.secondary,
                  margin: "0 0 8px"
                }}
              >
                No Featured Businesses Available Yet
              </h3>

              <p
                style={{
                  fontSize: "14px",
                  color: COLORS.muted,
                  lineHeight: "1.6",
                  margin: "0 0 20px"
                }}
              >
                {apiError
                  ? "Public business listing endpoint is currently awaiting backend connection in Day 6. Under APNA-BAZAR strict real-data rules, no dummy or fake business cards are displayed."
                  : "No businesses are currently registered in the database. Be the first local merchant to join APNA-BAZAR!"}
              </p>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: COLORS.warningBg,
                  color: "#9A6200",
                  border: `1px solid ${COLORS.warningBorder}`,
                  padding: "8px 14px",
                  borderRadius: RADIUS.small,
                  fontSize: "12px",
                  fontWeight: "500",
                  marginBottom: "20px"
                }}
              >
                <FaInfoCircle />
                <span>Strict Real Data Mode: Dynamic MongoDB records only</span>
              </div>

              <div>
                <Button
                  variant="primary"
                  onClick={() => navigate("/register")}
                  icon={<FaStore />}
                >
                  Register Your Business on APNA-BAZAR
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. HOW IT WORKS SECTION */}
      {/* ============================================================== */}
      <section
        id="how-it-works"
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isMobile ? "48px 20px" : isTablet ? "64px 28px" : "80px 32px",
          boxSizing: "border-box"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span
            style={{
              color: COLORS.primary,
              fontWeight: "700",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            Hassle-Free Experience
          </span>
          <h2
            style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.secondary,
              margin: "8px 0"
            }}
          >
            How APNA-BAZAR Works
          </h2>
          <p
            style={{
              ...TYPOGRAPHY.body,
              color: COLORS.muted,
              maxWidth: "520px",
              margin: "0 auto"
            }}
          >
            Booking appointments with neighborhood professionals takes less than 2 minutes.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isCompact ? "1fr" : "repeat(3, 1fr)",
            gap: isCompact ? "24px" : "32px"
          }}
        >
          {steps.map((st) => (
            <div
              key={st.number}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.large,
                padding: "32px 24px",
                boxShadow: SHADOWS.card,
                position: "relative",
                transition: `all ${TRANSITIONS.fast}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = SHADOWS.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = SHADOWS.card;
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px"
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: RADIUS.small,
                    background: COLORS.primaryBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {st.icon}
                </div>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "900",
                    color: COLORS.borderDark,
                    letterSpacing: "-0.04em"
                  }}
                >
                  {st.number}
                </span>
              </div>

              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: COLORS.secondary,
                  margin: "0 0 10px"
                }}
              >
                {st.title}
              </h3>

              <p
                style={{
                  fontSize: "14px",
                  color: COLORS.muted,
                  lineHeight: "1.6",
                  margin: 0
                }}
              >
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CALL TO ACTION (CTA) SECTION */}
      {/* ============================================================== */}
      <section
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isMobile ? "0 20px 48px" : "0 32px 64px",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isCompact ? "1fr" : "1fr 1fr",
            gap: "24px"
          }}
        >
          {/* Card 1: For Customers */}
          <div
            style={{
              background: "linear-gradient(135deg, #6258E8 0%, #4840C7 100%)",
              color: COLORS.white,
              padding: isMobile ? "32px 24px" : "44px 36px",
              borderRadius: RADIUS.large,
              boxShadow: SHADOWS.elevated,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: RADIUS.pill,
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: "16px"
                }}
              >
                For Customers
              </span>
              <h3
                style={{
                  fontSize: isMobile ? "22px" : "26px",
                  fontWeight: "800",
                  lineHeight: "1.25",
                  margin: "0 0 12px"
                }}
              >
                Ready to Book Your Next Appointment?
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#E2E0FF",
                  margin: "0 0 28px"
                }}
              >
                Explore local salons, mechanics, gyms, clinics and more in your city.
                Real availability, no waiting, 100% verified.
              </p>
            </div>

            <div>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate("/explore")}
                style={{
                  background: COLORS.white,
                  color: COLORS.primaryDark
                }}
              >
                Explore Businesses Now
              </Button>
            </div>
          </div>

          {/* Card 2: For Business Owners */}
          <div
            style={{
              background: COLORS.secondary,
              color: COLORS.white,
              padding: isMobile ? "32px 24px" : "44px 36px",
              borderRadius: RADIUS.large,
              boxShadow: SHADOWS.elevated,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "rgba(139, 130, 255, 0.25)",
                  color: COLORS.primaryLight,
                  borderRadius: RADIUS.pill,
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: "16px"
                }}
              >
                For Local Merchants
              </span>
              <h3
                style={{
                  fontSize: isMobile ? "22px" : "26px",
                  fontWeight: "800",
                  lineHeight: "1.25",
                  margin: "0 0 12px"
                }}
              >
                Grow Your Business with APNA-BAZAR
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#B9BBCB",
                  margin: "0 0 28px"
                }}
              >
                List your business, set working hours, define service pricing, and manage
                customer bookings through our dedicated owner dashboard.
              </p>
            </div>

            <div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/register")}
              >
                Register as Business Owner
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
