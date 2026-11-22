import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaArrowRight,
  FaCalendarAlt,
  FaUser,
  FaSignOutAlt,
  FaTachometerAlt
} from "react-icons/fa";
import { COLORS, SHADOWS, RADIUS, PAGE_WIDTH, TRANSITIONS } from "./designSystem";
import useResponsive from "../hooks/useResponsive";
import useAuth from "../hooks/useAuth";
import Button from "./Button";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const isCompact = isMobile || isTablet;

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? COLORS.primary : COLORS.text,
    fontWeight: isActive ? "700" : "500",
    fontSize: "14px",
    padding: "8px 12px",
    borderRadius: RADIUS.xs,
    transition: `all ${TRANSITIONS.fast}`
  });

  async function handleLogout() {
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <header
      style={{
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${COLORS.border}`,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: SHADOWS.sm
      }}
    >
      <div
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isCompact ? "14px 20px" : "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box"
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: COLORS.primary,
            textDecoration: "none",
            fontSize: isMobile ? "20px" : "22px",
            fontWeight: "800",
            letterSpacing: "-0.02em"
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: RADIUS.small,
              background: COLORS.primaryBg,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px"
            }}
          >
            <FaStore />
          </div>
          <span>
            APNA<span style={{ color: COLORS.secondary }}>-BAZAR</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        {!isCompact && (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <NavLink to="/" style={navLinkStyle}>
              Home
            </NavLink>
            <NavLink to="/explore" style={navLinkStyle}>
              Explore Businesses
            </NavLink>

            {/* Authenticated Customer Links */}
            {isAuthenticated && role === "CUSTOMER" && (
              <>
                <NavLink to="/my-appointments" style={navLinkStyle}>
                  My Appointments
                </NavLink>
                <NavLink to="/profile" style={navLinkStyle}>
                  Profile
                </NavLink>
              </>
            )}

            {/* Authenticated Business Owner Link */}
            {isAuthenticated && role === "BUSINESS_OWNER" && (
              <NavLink to="/business/dashboard" style={navLinkStyle}>
                Owner Dashboard
              </NavLink>
            )}

            {/* Authenticated Admin Link */}
            {isAuthenticated && role === "ADMIN" && (
              <NavLink to="/admin/dashboard" style={navLinkStyle}>
                Admin Portal
              </NavLink>
            )}
          </nav>
        )}

        {/* Desktop Action & Profile Buttons */}
        {!isCompact && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}
          >
            {!isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<FaArrowRight />}
                  iconPosition="right"
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </Button>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {role === "BUSINESS_OWNER" && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FaTachometerAlt />}
                    onClick={() => navigate("/business/dashboard")}
                  >
                    Dashboard
                  </Button>
                )}
                {role === "ADMIN" && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FaTachometerAlt />}
                    onClick={() => navigate("/admin/dashboard")}
                  >
                    Admin Portal
                  </Button>
                )}
                {role === "CUSTOMER" && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FaCalendarAlt />}
                    onClick={() => navigate("/my-appointments")}
                  >
                    Bookings
                  </Button>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    background: COLORS.surfaceSubtle,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.pill
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: RADIUS.round,
                      background: COLORS.primary,
                      color: COLORS.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "700"
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : <FaUser size={11} />}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: COLORS.secondary,
                      maxWidth: "120px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {user?.name || "Account"}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FaSignOutAlt />}
                  onClick={handleLogout}
                  style={{ color: COLORS.danger }}
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Hamburger Toggle */}
        {isCompact && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              borderRadius: RADIUS.xs,
              padding: "8px 10px",
              fontSize: "18px",
              color: COLORS.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {isCompact && mobileMenuOpen && (
        <div
          style={{
            background: COLORS.surface,
            borderTop: `1px solid ${COLORS.border}`,
            padding: "16px 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: SHADOWS.card
          }}
        >
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={navLinkStyle}
          >
            Home
          </NavLink>
          <NavLink
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            style={navLinkStyle}
          >
            Explore Businesses
          </NavLink>

          {isAuthenticated && role === "CUSTOMER" && (
            <>
              <NavLink
                to="/my-appointments"
                onClick={() => setMobileMenuOpen(false)}
                style={navLinkStyle}
              >
                My Appointments
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={navLinkStyle}
              >
                Profile
              </NavLink>
            </>
          )}

          {isAuthenticated && role === "BUSINESS_OWNER" && (
            <NavLink
              to="/business/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={navLinkStyle}
            >
              Business Dashboard
            </NavLink>
          )}

          {isAuthenticated && role === "ADMIN" && (
            <NavLink
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={navLinkStyle}
            >
              Admin Dashboard
            </NavLink>
          )}

          <div
            style={{
              height: "1px",
              background: COLORS.border,
              margin: "6px 0"
            }}
          />

          {!isAuthenticated ? (
            <>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/register");
                }}
              >
                Get Started
              </Button>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "10px 14px",
                  background: COLORS.surfaceSubtle,
                  borderRadius: RADIUS.small,
                  fontSize: "13px"
                }}
              >
                <div style={{ fontWeight: "700", color: COLORS.secondary }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: "11px", color: COLORS.muted }}>
                  {user?.email} ({role})
                </div>
              </div>
              <Button
                variant="danger"
                fullWidth
                icon={<FaSignOutAlt />}
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
