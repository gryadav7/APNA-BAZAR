import { Link } from "react-router-dom";
import { FaStore, FaRegCalendarCheck, FaShieldAlt } from "react-icons/fa";
import { COLORS, PAGE_WIDTH, RADIUS } from "./designSystem";
import useResponsive from "../hooks/useResponsive";

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  const currentYear = CURRENT_YEAR;

  const footerLinkStyle = {
    color: "#A0A4B8",
    textDecoration: "none",
    fontSize: "14px",
    lineHeight: "1.8",
    transition: "color 0.2s ease"
  };

  return (
    <footer
      style={{
        background: COLORS.secondary,
        color: COLORS.white,
        paddingTop: isCompact ? "48px" : "64px",
        paddingBottom: "32px",
        marginTop: "80px",
        borderTop: "1px solid #272B45"
      }}
    >
      <div
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isCompact ? "0 20px" : "0 28px",
          boxSizing: "border-box"
        }}
      >
        {/* Main Footer Content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "1fr 1fr"
              : "2fr 1fr 1fr 1fr",
            gap: isCompact ? "32px" : "48px",
            marginBottom: "48px"
          }}
        >
          {/* Brand Info */}
          <div>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                color: COLORS.white,
                textDecoration: "none",
                fontSize: "22px",
                fontWeight: "800",
                letterSpacing: "-0.02em",
                marginBottom: "16px"
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: RADIUS.small,
                  background: COLORS.primary,
                  color: COLORS.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px"
                }}
              >
                <FaStore />
              </div>
              <span>
                APNA<span style={{ color: COLORS.primaryLight }}>-BAZAR</span>
              </span>
            </Link>

            <p
              style={{
                color: "#A0A4B8",
                fontSize: "14px",
                lineHeight: "1.7",
                maxWidth: "340px",
                margin: "0 0 20px"
              }}
            >
              Your trusted local business discovery and appointment booking
              platform. Connect with top-rated local professionals in your city.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "13px",
                color: "#88899B"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaShieldAlt color={COLORS.primaryLight} /> Verified Local Merchants
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaRegCalendarCheck color={COLORS.primaryLight} /> Instant Online Slot Booking
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                color: COLORS.white,
                fontSize: "15px",
                fontWeight: "700",
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Explore
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link to="/" style={footerLinkStyle}>
                Home
              </Link>
              <Link to="/explore" style={footerLinkStyle}>
                Find Businesses
              </Link>
              <a href="#categories" style={footerLinkStyle}>
                Popular Categories
              </a>
              <a href="#how-it-works" style={footerLinkStyle}>
                How It Works
              </a>
            </div>
          </div>

          {/* For Business Owners */}
          <div>
            <h4
              style={{
                color: COLORS.white,
                fontSize: "15px",
                fontWeight: "700",
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Business Owners
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link to="/register" style={footerLinkStyle}>
                List Your Business
              </Link>
              <Link to="/login" style={footerLinkStyle}>
                Partner Login
              </Link>
              <Link to="/business" style={footerLinkStyle}>
                Owner Dashboard
              </Link>
            </div>
          </div>

          {/* Platform Trust & Support */}
          <div>
            <h4
              style={{
                color: COLORS.white,
                fontSize: "15px",
                fontWeight: "700",
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Platform
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ ...footerLinkStyle, cursor: "default" }}>
                Secure JWT Authentication
              </span>
              <span style={{ ...footerLinkStyle, cursor: "default" }}>
                Real-Time Availability
              </span>
              <span style={{ ...footerLinkStyle, cursor: "default" }}>
                Transparent Pricing
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid #272B45",
            paddingTop: "24px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: "12px",
            fontSize: "13px",
            color: "#88899B"
          }}
        >
          <div>
            © {currentYear} APNA-BAZAR Platform. All rights reserved.
          </div>
          <div>
            Engineered with React 19 & Express 5
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
