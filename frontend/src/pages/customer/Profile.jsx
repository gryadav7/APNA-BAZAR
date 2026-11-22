import { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaVenusMars,
  FaShieldAlt,
  FaSave,
  FaExclamationCircle,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  PAGE_WIDTH,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import customerService from "../../services/customerService";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

function Profile() {
  const { user, role, updateUser, logout } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    dateOfBirth: "",
    gender: ""
  });

  const [errors, setErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProfileApiAwaiting, setIsProfileApiAwaiting] = useState(false);

  // Fetch real profile data on mount
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setInitialLoading(true);
        const data = await customerService.getProfile();

        if (isMounted) {
          const u = data?.user || user;
          const p = data?.profile;

          let dobString = "";
          if (p?.dateOfBirth) {
            dobString = new Date(p.dateOfBirth).toISOString().slice(0, 10);
          }

          setFormData({
            name: u?.name || "",
            email: u?.email || "",
            address: p?.address || "",
            city: p?.city || "",
            dateOfBirth: dobString,
            gender: p?.gender || ""
          });

          if (data?.isProfileApiAwaiting) {
            setIsProfileApiAwaiting(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setServerError(
            err.customMessage ||
              err.message ||
              "Failed to load profile from server."
          );
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

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

  function validateForm() {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (formData.dateOfBirth) {
      const selected = new Date(formData.dateOfBirth);
      const today = new Date();
      if (selected > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
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
      setSaving(true);

      const updatePayload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined
      };

      const res = await customerService.updateProfile(updatePayload);

      setSuccessMessage(
        res?.message || "Profile updated successfully!"
      );

      // Update auth context name if modified
      if (formData.name !== user?.name) {
        updateUser({ name: formData.name.trim() });
      }
    } catch (err) {
      if (err.status === 404 || !err.status) {
        setIsProfileApiAwaiting(true);
        setServerError(
          "Customer profile update route (PUT /api/customers/profile) is awaiting backend implementation. Real MongoDB update was not executed."
        );
      } else {
        setServerError(
          err.customMessage ||
            err.response?.data?.message ||
            err.message ||
            "Failed to update profile. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Verified Member";

  if (initialLoading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "14px"
        }}
      >
        <Loader size={44} text="Loading customer profile..." />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: PAGE_WIDTH,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 64px" : "40px 28px 80px",
        boxSizing: "border-box"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.secondary,
            margin: "0 0 8px",
            fontSize: isMobile ? "28px" : "36px"
          }}
        >
          Customer Profile
        </h1>
        <p style={{ ...TYPOGRAPHY.body, color: COLORS.muted, margin: 0 }}>
          View and update your personal information and appointment contact preferences.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "320px 1fr",
          gap: "32px",
          alignItems: "start"
        }}
      >
        {/* Left Column: Identity & Account Summary Card */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: "36px 24px",
            textAlign: "center"
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: RADIUS.round,
              background: COLORS.primaryBg,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "800",
              margin: "0 auto 16px"
            }}
          >
            {formData.name ? formData.name.charAt(0).toUpperCase() : <FaUser />}
          </div>

          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: COLORS.secondary,
              margin: "0 0 6px"
            }}
          >
            {formData.name || "Customer Account"}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              margin: "0 0 16px"
            }}
          >
            {formData.email}
          </p>

          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              background: COLORS.successBg,
              color: COLORS.success,
              borderRadius: RADIUS.pill,
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "24px"
            }}
          >
            {role || "CUSTOMER"}
          </div>

          <div
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: "20px",
              textAlign: "left",
              fontSize: "13px",
              color: COLORS.muted,
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaShieldAlt color={COLORS.primary} />
              <span>Verified Session</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaCalendarAlt color={COLORS.primary} />
              <span>Joined {memberSince}</span>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => logout()}
              style={{ color: COLORS.danger, borderColor: COLORS.border }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Right Column: Profile Edit Form */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "24px 18px" : "36px 32px"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: `1px solid ${COLORS.border}`
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.secondary,
                margin: 0
              }}
            >
              Personal & Contact Information
            </h3>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: COLORS.success
              }}
            >
              <FaShieldAlt /> Real MongoDB Data
            </div>
          </div>

          {/* Backend Status / Notice */}
          {isProfileApiAwaiting && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 16px",
                background: COLORS.infoBg,
                border: `1px solid ${COLORS.infoBorder}`,
                borderRadius: RADIUS.small,
                color: "#1E40AF",
                fontSize: "13px",
                marginBottom: "20px"
              }}
            >
              <FaInfoCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>Backend Integration Notice:</strong> Core customer identity (Name, Email, Role)
                is powered by <code>/api/auth/me</code>. Extended profile attributes (Address, City,
                Date of Birth, Gender) utilize the <code>CustomerProfile</code> schema and will persist
                to MongoDB once <code>PUT /api/customers/profile</code> is connected.
              </div>
            </div>
          )}

          {/* Error Alert */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "0px" : "18px"
              }}
            >
              <InputField
                label="Full Name"
                id="profile-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                error={errors.name}
                icon={<FaUser />}
                required
                disabled={saving}
              />

              <InputField
                label="Email Address (Verified)"
                id="profile-email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                helperText="Primary email cannot be changed"
                icon={<FaEnvelope />}
              />
            </div>

            <InputField
              label="Street Address"
              id="profile-address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. 104, MG Road, Landmark..."
              icon={<FaMapMarkerAlt />}
              disabled={saving}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "0px" : "18px"
              }}
            >
              <InputField
                label="City / Region"
                id="profile-city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai, Pune..."
                icon={<FaMapMarkerAlt />}
                disabled={saving}
              />

              <InputField
                label="Date of Birth"
                id="profile-dob"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                error={errors.dateOfBirth}
                icon={<FaCalendarAlt />}
                disabled={saving}
              />
            </div>

            {/* Gender Selection */}
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
                Gender
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px"
                }}
              >
                {["MALE", "FEMALE", "OTHER"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: g }))}
                    disabled={saving}
                    style={{
                      padding: "10px",
                      border: `1px solid ${
                        formData.gender === g ? COLORS.primary : COLORS.border
                      }`,
                      background:
                        formData.gender === g ? COLORS.primaryBg : COLORS.surface,
                      color:
                        formData.gender === g ? COLORS.primaryDark : COLORS.text,
                      borderRadius: RADIUS.small,
                      fontWeight: formData.gender === g ? "700" : "500",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <FaVenusMars size={12} />
                    <span>{g.charAt(0) + g.slice(1).toLowerCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={saving}
                icon={<FaSave />}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
