import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaStore,
  FaUserCheck,
  FaBriefcase,
  FaExclamationCircle,
  FaCheckCircle,
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

function Register() {
  const { isMobile } = useResponsive();
  const { register, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER" // "CUSTOMER" or "BUSINESS_OWNER"
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  }

  // Role selector handler
  function handleRoleSelect(selectedRole) {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
    if (serverError) {
      setServerError("");
    }
  }

  // Client-side validation
  function validateForm() {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      });

      setSuccessMessage(
        "Account created successfully! Redirecting you to sign in..."
      );

      // Backend register does not set cookie; redirect to login
      setTimeout(() => {
        navigate("/login", {
          state: {
            registeredEmail: formData.email.trim().toLowerCase(),
            message: "Registration successful. Please log in to continue."
          }
        });
      }, 1200);
    } catch (err) {
      setServerError(
        err.customMessage ||
          err.response?.data?.message ||
          err.message ||
          "Registration failed. Please check your information and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "85vh",
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
          maxWidth: "480px",
          background: COLORS.surface,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.elevated,
          border: `1px solid ${COLORS.border}`,
          padding: isMobile ? "32px 20px" : "44px 36px",
          boxSizing: "border-box"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
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
            Create Your Account
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              margin: 0
            }}
          >
            Join APNA-BAZAR to explore or manage local services.
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

        {/* Role Selection Tabs */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: COLORS.secondary,
              marginBottom: "8px"
            }}
          >
            I want to join as:
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px"
            }}
          >
            {/* Customer Option */}
            <div
              onClick={() => handleRoleSelect("CUSTOMER")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleRoleSelect("CUSTOMER");
              }}
              style={{
                border: `2px solid ${
                  formData.role === "CUSTOMER" ? COLORS.primary : COLORS.border
                }`,
                background:
                  formData.role === "CUSTOMER" ? COLORS.primaryBg : COLORS.surface,
                borderRadius: RADIUS.medium,
                padding: "14px 12px",
                cursor: "pointer",
                textAlign: "center",
                transition: `all ${TRANSITIONS.fast}`
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  color:
                    formData.role === "CUSTOMER"
                      ? COLORS.primary
                      : COLORS.muted,
                  marginBottom: "4px"
                }}
              >
                <FaUserCheck />
              </div>
              <strong
                style={{
                  display: "block",
                  fontSize: "13px",
                  color:
                    formData.role === "CUSTOMER"
                      ? COLORS.primaryDark
                      : COLORS.secondary
                }}
              >
                Customer
              </strong>
              <span style={{ fontSize: "11px", color: COLORS.muted }}>
                Book local services
              </span>
            </div>

            {/* Business Owner Option */}
            <div
              onClick={() => handleRoleSelect("BUSINESS_OWNER")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleRoleSelect("BUSINESS_OWNER");
              }}
              style={{
                border: `2px solid ${
                  formData.role === "BUSINESS_OWNER"
                    ? COLORS.primary
                    : COLORS.border
                }`,
                background:
                  formData.role === "BUSINESS_OWNER"
                    ? COLORS.primaryBg
                    : COLORS.surface,
                borderRadius: RADIUS.medium,
                padding: "14px 12px",
                cursor: "pointer",
                textAlign: "center",
                transition: `all ${TRANSITIONS.fast}`
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  color:
                    formData.role === "BUSINESS_OWNER"
                      ? COLORS.primary
                      : COLORS.muted,
                  marginBottom: "4px"
                }}
              >
                <FaBriefcase />
              </div>
              <strong
                style={{
                  display: "block",
                  fontSize: "13px",
                  color:
                    formData.role === "BUSINESS_OWNER"
                      ? COLORS.primaryDark
                      : COLORS.secondary
                }}
              >
                Business Owner
              </strong>
              <span style={{ fontSize: "11px", color: COLORS.muted }}>
                List & manage services
              </span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          <InputField
            label="Full Name"
            id="reg-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            error={errors.name}
            icon={<FaUser />}
            required
            autoComplete="name"
            disabled={loading}
          />

          <InputField
            label="Email Address"
            id="reg-email"
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
            id="reg-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            error={errors.password}
            helperText="Minimum 6 characters required"
            icon={<FaLock />}
            required
            autoComplete="new-password"
            disabled={loading}
          />

          <InputField
            label="Confirm Password"
            id="reg-confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            icon={<FaLock />}
            required
            autoComplete="new-password"
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
              Create {formData.role === "BUSINESS_OWNER" ? "Business" : "Customer"} Account
            </Button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div
          style={{
            marginTop: "26px",
            paddingTop: "20px",
            borderTop: `1px solid ${COLORS.border}`,
            textAlign: "center",
            fontSize: "13px",
            color: COLORS.muted
          }}
        >
          <p style={{ margin: "0 0 10px" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: COLORS.primary,
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              Sign in
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
        </div>
      </div>
    </div>
  );
}

export default Register;
