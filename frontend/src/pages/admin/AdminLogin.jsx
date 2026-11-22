import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaKey,
  FaArrowLeft,
  FaLockOpen
} from "react-icons/fa";
import {
  COLORS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

function AdminLogin() {
  const { isMobile } = useResponsive();
  const { login, logout, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated as ADMIN, redirect straight to admin dashboard
  if (isAuthenticated && role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  }

  // Quick helper to fill admin demo credentials
  function fillDemoAdmin() {
    setFormData({
      email: "prashant@gmail.com",
      password: "123456"
    });
    setErrors({});
    setServerError("");
  }

  function validateForm() {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = "Admin email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid administrative email";
    }

    if (!formData.password) {
      newErrors.password = "Admin security password is required";
    } else if (formData.password.length < 5) {
      newErrors.password = "Password must be at least 5 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const loggedUser = await login(formData.email.trim(), formData.password);

      // Verify that this account is an ADMIN
      if (loggedUser.role !== "ADMIN") {
        await logout();
        setServerError(
          `Access Denied: This portal is strictly restricted to platform administrators. Your account has the role "${loggedUser.role}".`
        );
        setLoading(false);
        return;
      }

      setSuccessMessage("Admin authentication verified! Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 700);
    } catch (err) {
      setServerError(
        err.customMessage ||
          err.response?.data?.message ||
          err.message ||
          "Invalid admin credentials or account is suspended."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 50% 0%, #1e293b 0%, ${COLORS.secondary} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "24px 16px" : "40px 20px",
        boxSizing: "border-box"
      }}
    >
      {/* Return to customer site */}
      <div style={{ width: "100%", maxWidth: "460px", marginBottom: "16px" }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#94A3B8",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "500",
            transition: `color ${TRANSITIONS.fast}`
          }}
        >
          <FaArrowLeft size={11} />
          <span>Back to ApnaBazar Marketplace</span>
        </Link>
      </div>

      {/* Main Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: COLORS.surface,
          borderRadius: RADIUS.large,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflow: "hidden"
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            padding: isMobile ? "24px 20px" : "32px 28px",
            textAlign: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: RADIUS.round,
              background: "rgba(217, 119, 6, 0.15)",
              border: "1px solid rgba(217, 119, 6, 0.35)",
              color: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 14px",
              boxShadow: "0 0 20px rgba(245, 158, 11, 0.2)"
            }}
          >
            <FaShieldAlt />
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              background: "rgba(245, 158, 11, 0.2)",
              color: "#FCD34D",
              borderRadius: RADIUS.pill,
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "8px"
            }}
          >
            Platform Administration
          </div>

          <h1
            style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.white,
              margin: "0 0 6px",
              letterSpacing: "-0.02em"
            }}
          >
            APNA-BAZAR Console
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#94A3B8",
              margin: 0
            }}
          >
            Startup Founder & Superadmin Control Center
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: isMobile ? "24px 20px" : "32px 28px" }}>
          {/* Quick Demo Fill Pill */}
          <div
            style={{
              background: COLORS.surfaceSubtle,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.small,
              padding: "10px 14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px"
            }}
          >
            <div style={{ fontSize: "12px", color: COLORS.textSecondary }}>
              Admin Demo: <strong style={{ color: COLORS.secondary }}>prashant@gmail.com</strong>
            </div>
            <button
              type="button"
              onClick={fillDemoAdmin}
              style={{
                background: COLORS.primaryBg,
                color: COLORS.primaryDark,
                border: "none",
                borderRadius: RADIUS.xs,
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <FaKey size={10} />
              <span>Fill Admin Demo</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {serverError && (
            <div
              style={{
                background: COLORS.dangerBg,
                border: `1px solid ${COLORS.dangerBorder}`,
                borderRadius: RADIUS.small,
                padding: "12px 14px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                color: COLORS.danger,
                fontSize: "13px",
                lineHeight: "1.5"
              }}
            >
              <FaExclamationCircle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: COLORS.successBg,
                border: `1px solid ${COLORS.successBorder}`,
                borderRadius: RADIUS.small,
                padding: "12px 14px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: COLORS.success,
                fontSize: "13px"
              }}
            >
              <FaCheckCircle size={15} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label="Admin Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. admin@gmail.com"
              icon={<FaEnvelope />}
              error={errors.email}
              autoComplete="username"
              required
            />

            <InputField
              label="Admin Security Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter administrator password"
              icon={<FaLock />}
              error={errors.password}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              icon={<FaLockOpen />}
              style={{
                width: "100%",
                marginTop: "10px",
                background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
                fontWeight: "700",
                justifyContent: "center"
              }}
            >
              {loading ? "Authenticating Admin..." : "Authenticate & Open Console"}
            </Button>
          </form>

          {/* Standard Login redirect */}
          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: `1px solid ${COLORS.border}`,
              textAlign: "center",
              fontSize: "12px",
              color: COLORS.textSecondary
            }}
          >
            <span>Customer or Business Owner? </span>
            <Link
              to="/login"
              style={{
                color: COLORS.primary,
                fontWeight: "600",
                textDecoration: "none"
              }}
            >
              Standard Portal Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
