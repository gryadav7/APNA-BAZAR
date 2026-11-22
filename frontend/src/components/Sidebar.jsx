import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaStore,
  FaSignOutAlt,
  FaChartBar,
  FaBriefcase,
  FaTimes,
  FaUserShield,
  FaUserTie,
  FaCrown,
  FaCreditCard
} from "react-icons/fa";
import { COLORS, RADIUS, TRANSITIONS } from "./designSystem";
import useAuth from "../hooks/useAuth";

function Sidebar({ role = "BUSINESS_OWNER", onClose = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isNormalizedAdmin =
    role === "ADMIN" || role === "admin";

  const menus = isNormalizedAdmin
    ? [
        { name: "Overview", path: "/admin/dashboard", icon: <FaHome /> },
        { name: "User Directory", path: "/admin/users", icon: <FaUsers /> },
        { name: "Businesses", path: "/admin/businesses", icon: <FaStore /> },
        { name: "All Appointments", path: "/admin/appointments", icon: <FaCalendarAlt /> },
        { name: "Transactions", path: "/admin/transactions", icon: <FaCreditCard /> }
      ]
    : [
        { name: "Dashboard", path: "/business/dashboard", icon: <FaHome /> },
        { name: "My Business", path: "/business/manage", icon: <FaBriefcase /> },
        { name: "Manage Services", path: "/business/services", icon: <FaStore /> },
        { name: "Availability", path: "/business/availability", icon: <FaCalendarAlt /> },
        { name: "Appointments", path: "/business/appointments", icon: <FaChartBar /> },
        { name: "Customers", path: "/business/customers", icon: <FaUsers /> },
        { name: "Plans & Billing", path: "/business/subscription", icon: <FaCrown /> }
      ];

  async function handleLogout() {
    await logout();
    if (onClose) onClose();
    navigate("/login");
  }

  return (
    <aside
      style={{
        width: "255px",
        minWidth: "255px",
        background: COLORS.secondary,
        color: COLORS.white,
        minHeight: "100%",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box"
      }}
    >
      <div>
        {/* Header / Brand in Sidebar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            padding: "0 8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: RADIUS.small,
                background: isNormalizedAdmin ? "#D97706" : COLORS.primary,
                color: COLORS.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px"
              }}
            >
              {isNormalizedAdmin ? <FaUserShield /> : <FaUserTie />}
            </div>
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: "700",
                  color: COLORS.white
                }}
              >
                {isNormalizedAdmin ? "Admin Portal" : "Merchant Suite"}
              </h4>
              <span
                style={{
                  fontSize: "11px",
                  color: "#88899B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: "600"
                }}
              >
                APNA-BAZAR
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              style={{
                background: "transparent",
                border: "none",
                color: "#A0A4B8",
                fontSize: "18px",
                cursor: "pointer",
                padding: "6px"
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Navigation Menus */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose ? onClose : undefined}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: RADIUS.small,
                textDecoration: "none",
                color: isActive ? COLORS.white : "#B9BBCB",
                background: isActive ? COLORS.primary : "transparent",
                fontWeight: isActive ? "700" : "500",
                fontSize: "14px",
                transition: `all ${TRANSITIONS.fast}`
              })}
            >
              <span style={{ fontSize: "16px", display: "flex" }}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Profile & Logout Bottom Bar */}
      <div
        style={{
          borderTop: "1px solid #272B45",
          paddingTop: "20px",
          marginTop: "24px"
        }}
      >
        {user && (
          <div
            style={{
              padding: "10px 12px",
              background: "#1E223D",
              borderRadius: RADIUS.small,
              marginBottom: "12px"
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: COLORS.white,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {user.name || "Logged In User"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#88899B",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {user.email || ""}
            </div>
            <div
              style={{
                display: "inline-block",
                fontSize: "10px",
                fontWeight: "700",
                color: isNormalizedAdmin ? "#FCD34D" : COLORS.primaryLight,
                marginTop: "4px",
                textTransform: "uppercase"
              }}
            >
              Role: {user.role || role}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "11px 14px",
            border: "1px solid #363A58",
            borderRadius: RADIUS.small,
            background: "transparent",
            color: "#E5484D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: `all ${TRANSITIONS.fast}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(229, 72, 77, 0.1)";
            e.currentTarget.style.borderColor = "#E5484D";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#363A58";
          }}
        >
          <FaSignOutAlt /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
