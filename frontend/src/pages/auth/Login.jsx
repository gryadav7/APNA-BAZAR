import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaExclamationCircle,
  FaCheckCircle,
  FaStore,
  FaArrowRight
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

function Login() {
  const { isMobile } = useResponsive();
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form State
  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || ""
  );
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to appropriate role portal
  if (isAuthenticated) {
    if (role === "BUSINESS_OWNER") {
      return <Navigate to="/business/dashboard" replace />;
    }
    if (role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Field change handler
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  }

  // Client-side validation
  function validateForm() {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const user = await login(formData.email.trim(), formData.password);

      setSuccessMessage("Login successful! Redirecting...");

      // Determine destination route
      const destination =
        location.state?.from?.pathname ||
        (user.role === "BUSINESS_OWNER"
          ? "/business/dashboard"
          : user.role === "ADMIN"
          ? "/admin/dashboard"
          : "/");

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 700);
    } catch (err) {
      setServerError(
        err.customMessage ||
          err.response?.data?.message ||
          err.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "32px 16px" : "48px 24px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: COLORS.surface,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.elevated,
          border: `1px solid ${COLORS.border}`,
          padding: isMobile ? "32px 20px" : "44px 36px",
          boxSizing: "border-box"
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.medium,
              background: COLORS.primaryBg,
              color: COLORS.primary,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              marginBottom: "14px"
            }}
          >
            <FaStore />
          </div>

          <h1
            style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.secondary,
              margin: "0 0 8px"
            }}
          >
            Welcome Back
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              margin: 0
            }}
          >
            Sign in to access your appointments & dashboard.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 16px",
              background: COLORS.dangerBg,
              border: `1px solid ${COLORS.dangerBorder}`,
              borderRadius: RADIUS.small,
              color: COLORS.danger,
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "20px"
            }}
          >
            <FaExclamationCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              background: COLORS.successBg,
              border: `1px solid ${COLORS.successBorder}`,
              borderRadius: RADIUS.small,
              color: COLORS.success,
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "20px"
            }}
          >
            <FaCheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <InputField
            label="Email Address"
            id="login-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
            icon={<FaEnvelope />}
            required
            autoComplete="email"
            disabled={loading}
          />

          <InputField
            label="Password"
            id="login-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            error={errors.password}
            icon={<FaLock />}
            required
            autoComplete="current-password"
            disabled={loading}
          />

          <div style={{ marginTop: "24px" }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<FaArrowRight />}
              iconPosition="right"
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: `1px solid ${COLORS.border}`,
            textAlign: "center",
            fontSize: "13px",
            color: COLORS.muted
          }}
        >
          <p style={{ margin: "0 0 10px" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: COLORS.primary,
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              Register here
            </Link>
          </p>

          <Link
            to="/"
            style={{
              color: COLORS.muted,
              textDecoration: "none",
              fontSize: "12px",
              transition: `color ${TRANSITIONS.fast}`
            }}
          >
            ← Back to Marketplace
          </Link>

          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: `1px dashed ${COLORS.border}` }}>
            <Link
              to="/admin/login"
              style={{
                color: "#D97706",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span>Startup Administrator? Access Admin Console →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
