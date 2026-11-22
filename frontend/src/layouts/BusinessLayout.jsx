import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { FaBars, FaExternalLinkAlt, FaStore } from "react-icons/fa";
import { COLORS, RADIUS, SHADOWS } from "../components/designSystem";
import useResponsive from "../hooks/useResponsive";
import useAuth from "../hooks/useAuth";
import Sidebar from "../components/Sidebar";

function BusinessLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuth();
  const isCompact = isMobile || isTablet;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: COLORS.background
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          height: "64px",
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isCompact ? "0 16px" : "0 28px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: SHADOWS.sm,
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Mobile sidebar toggle button */}
          {isCompact && (
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle navigation sidebar"
              style={{
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                borderRadius: RADIUS.xs,
                padding: "8px 10px",
                fontSize: "16px",
                color: COLORS.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FaBars />
            </button>
          )}

          <Link
            to="/business/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: COLORS.primary,
              textDecoration: "none",
              fontSize: "19px",
              fontWeight: "800",
              letterSpacing: "-0.02em"
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: RADIUS.small,
                background: COLORS.primaryBg,
                color: COLORS.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px"
              }}
            >
              <FaStore />
            </div>
            <span>
              APNA<span style={{ color: COLORS.secondary }}>-BAZAR</span>
            </span>
          </Link>

          {!isMobile && (
            <span
              style={{
                padding: "3px 10px",
                background: COLORS.primaryBg,
                color: COLORS.primaryDark,
                borderRadius: RADIUS.pill,
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.04em",
                textTransform: "uppercase"
              }}
            >
              Merchant Workspace
            </span>
          )}
        </div>

        {/* Right side utilities */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            to="/explore"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "600",
              color: COLORS.muted,
              textDecoration: "none"
            }}
          >
            {!isMobile && "View Marketplace"} <FaExternalLinkAlt size={12} />
          </Link>

          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingLeft: "14px",
                borderLeft: `1px solid ${COLORS.border}`
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: RADIUS.round,
                  background: COLORS.primary,
                  color: COLORS.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "13px"
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "B"}
              </div>
              {!isCompact && (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: COLORS.secondary
                    }}
                  >
                    {user.name}
                  </div>
                  <div style={{ fontSize: "11px", color: COLORS.muted }}>
                    Owner
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* Desktop Sidebar */}
        {!isCompact && (
          <Sidebar role="BUSINESS_OWNER" />
        )}

        {/* Mobile Sidebar Overlay / Drawer */}
        {isCompact && mobileSidebarOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 17, 35, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex"
            }}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div
              style={{
                width: "260px",
                height: "100%",
                background: COLORS.secondary,
                boxShadow: SHADOWS.modal
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                role="BUSINESS_OWNER"
                onClose={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile ? "20px 16px" : isTablet ? "24px 20px" : "32px",
            boxSizing: "border-box"
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default BusinessLayout;
