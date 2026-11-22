import { useNavigate } from "react-router-dom";
import { FaHome, FaTachometerAlt, FaExclamationTriangle } from "react-icons/fa";
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from "../components/designSystem";
import useAuth from "../hooks/useAuth";
import Button from "../components/Button";

function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px"
      }}
    >
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.card,
          padding: "56px 36px",
          textAlign: "center",
          maxWidth: "520px",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: RADIUS.round,
            background: COLORS.dangerBg,
            color: COLORS.danger,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            margin: "0 auto 20px"
          }}
        >
          <FaExclamationTriangle />
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: "900",
            color: COLORS.secondary,
            lineHeight: "1",
            margin: "0 0 10px",
            letterSpacing: "-0.04em"
          }}
        >
          404
        </h1>

        <h2
          style={{
            ...TYPOGRAPHY.h3,
            color: COLORS.secondary,
            margin: "0 0 12px"
          }}
        >
          Page Not Found
        </h2>

        <p
          style={{
            ...TYPOGRAPHY.body,
            color: COLORS.muted,
            margin: "0 0 32px",
            lineHeight: "1.6"
          }}
        >
          The page you requested could not be found or you may not have
          sufficient permissions to view it.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center"
          }}
        >
          <Button
            variant="primary"
            icon={<FaHome />}
            onClick={() => navigate("/")}
          >
            Go to Homepage
          </Button>

          {isAuthenticated && role === "BUSINESS_OWNER" && (
            <Button
              variant="outline"
              icon={<FaTachometerAlt />}
              onClick={() => navigate("/business/dashboard")}
            >
              My Dashboard
            </Button>
          )}

          {isAuthenticated && role === "ADMIN" && (
            <Button
              variant="outline"
              icon={<FaTachometerAlt />}
              onClick={() => navigate("/admin/dashboard")}
            >
              Admin Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotFound;
