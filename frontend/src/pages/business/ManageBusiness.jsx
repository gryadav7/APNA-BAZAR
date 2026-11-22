import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaStore,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaGlobe,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaExternalLinkAlt,
  FaSave,
  FaUndo,
  FaInfoCircle,
  FaTag
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import businessService from "../../services/businessService";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Loader from "../../components/Loader";

const STANDARD_CATEGORIES = [
  "Salon & Hair",
  "Spa & Wellness",
  "Healthcare & Clinics",
  "Fitness & Gym",
  "Automotive & Repair",
  "Home Maintenance & Cleaning",
  "Beauty & Makeup",
  "Pet Care & Veterinary",
  "Professional Consulting",
  "Education & Tutoring",
  "Other"
];

function formatCreatedDate(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function ManageBusiness() {
  const { isMobile } = useResponsive();

  // Business profile state
  const [business, setBusiness] = useState(null);
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Form input state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    customCategory: "",
    address: "",
    city: "",
    contactNumber: "",
    website: "",
    openingHours: "",
    description: ""
  });

  // UI state
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Load existing business profile
  useEffect(() => {
    let isMounted = true;

    async function loadBusiness() {
      try {
        setLoadError("");
        const res = await businessService.getMyBusiness();
        const biz = res?.business || res?.data || res;

        if (isMounted && biz && biz._id) {
          setBusiness(biz);
          setIsExisting(true);

          const isStandard = STANDARD_CATEGORIES.includes(biz.category);
          setFormData({
            name: biz.name || "",
            category: isStandard ? biz.category : "Other",
            customCategory: isStandard ? "" : biz.category || "",
            address: biz.address || "",
            city: biz.city || "",
            contactNumber: biz.contactNumber || "",
            website: biz.website || "",
            openingHours: biz.openingHours || "",
            description: biz.description || ""
          });
        }
      } catch (err) {
        if (isMounted) {
          // If 404: owner does not have a business yet (Onboarding mode)
          if (err.status === 404) {
            setIsExisting(false);
            setBusiness(null);
          } else {
            setLoadError(
              err.customMessage ||
                err.message ||
                "Failed to fetch your business details."
            );
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBusiness();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle form field change
  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaveSuccess("");
    setSaveError("");

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  // Form Validation
  function validateForm() {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = "Business name is required.";
    }

    if (!formData.category) {
      errs.category = "Please select a business category.";
    } else if (formData.category === "Other" && !formData.customCategory.trim()) {
      errs.customCategory = "Please specify your business category.";
    }

    if (!formData.address.trim()) {
      errs.address = "Street address is required.";
    }

    if (!formData.city.trim()) {
      errs.city = "City is required.";
    }

    if (!formData.contactNumber.trim()) {
      errs.contactNumber = "Contact phone number is required.";
    } else {
      const phoneDigits = formData.contactNumber.replace(/\D/g, "");
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        errs.contactNumber = "Please enter a valid phone number (7-15 digits).";
      }
    }

    if (formData.website.trim()) {
      const urlPattern =
        /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
      if (!urlPattern.test(formData.website.trim())) {
        errs.website = "Please enter a valid website URL (e.g. example.com).";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Handle Save / Submit
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");
      setSaveSuccess("");

      const finalCategory =
        formData.category === "Other"
          ? formData.customCategory.trim()
          : formData.category;

      const payload = {
        name: formData.name.trim(),
        category: finalCategory,
        address: formData.address.trim(),
        city: formData.city.trim(),
        contactNumber: formData.contactNumber.trim(),
        website: formData.website.trim() || undefined,
        openingHours: formData.openingHours.trim() || undefined,
        description: formData.description.trim() || undefined
      };

      let res;
      if (isExisting) {
        // Update existing business
        res = await businessService.updateMyBusiness(payload);
        const updatedBiz = res?.business || res?.data || res;
        setBusiness(updatedBiz);
        setSaveSuccess("Business profile updated successfully!");
      } else {
        // Create initial business profile
        res = await businessService.createBusiness(payload);
        const newBiz = res?.business || res?.data || res;
        setBusiness(newBiz);
        setIsExisting(true);
        setSaveSuccess("Congratulations! Your business profile has been registered successfully.");
      }

      setIsDirty(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSaveSuccess(""), 5000);
    } catch (err) {
      setSaveError(
        err.customMessage ||
          err.message ||
          "Failed to save business profile. Please verify your details."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  }

  // Reset form to latest saved values
  function handleDiscard() {
    if (!business) {
      setFormData({
        name: "",
        category: "",
        customCategory: "",
        address: "",
        city: "",
        contactNumber: "",
        website: "",
        openingHours: "",
        description: ""
      });
    } else {
      const isStandard = STANDARD_CATEGORIES.includes(business.category);
      setFormData({
        name: business.name || "",
        category: isStandard ? business.category : "Other",
        customCategory: isStandard ? "" : business.category || "",
        address: business.address || "",
        city: business.city || "",
        contactNumber: business.contactNumber || "",
        website: business.website || "",
        openingHours: business.openingHours || "",
        description: business.description || ""
      });
    }
    setFieldErrors({});
    setIsDirty(false);
    setSaveError("");
    setSaveSuccess("");
  }

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Loader size="lg" message="Loading business profile..." />
      </div>
    );
  }

  // Error loading state
  if (loadError) {
    return (
      <div
        style={{
          background: COLORS.dangerBg,
          border: `1px solid ${COLORS.dangerBorder}`,
          borderRadius: RADIUS.medium,
          padding: "36px 24px",
          textAlign: "center",
          maxWidth: "600px",
          margin: "40px auto"
        }}
      >
        <FaExclamationTriangle size={36} color={COLORS.danger} style={{ marginBottom: "14px" }} />
        <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
          Unable to Load Business
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const hasActualRating =
    business && typeof business.rating === "number" && business.rating > 0;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Top Page Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: "18px",
          marginBottom: "28px"
        }}
      >
        <div>
          <h1
            style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.secondary,
              margin: "0 0 6px",
              fontSize: isMobile ? "24px" : "30px"
            }}
          >
            {isExisting ? "Manage Business Profile" : "Register Your Business"}
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: COLORS.muted }}>
            {isExisting
              ? "Update your merchant information, operating hours, and location visible to customers."
              : "Set up your public merchant listing to start adding services and receiving bookings."}
          </p>
        </div>

        {/* View Live Marketplace Listing */}
        {isExisting && business?._id && (
          <Link
            to={`/business/${business._id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Button variant="outline" size="md" icon={<FaExternalLinkAlt size={12} />}>
              View Live Listing
            </Button>
          </Link>
        )}
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div
          style={{
            background: COLORS.successBg,
            border: `1px solid ${COLORS.successBorder}`,
            color: COLORS.success,
            borderRadius: RADIUS.small,
            padding: "14px 18px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <FaCheckCircle size={18} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {saveError && (
        <div
          style={{
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            color: COLORS.danger,
            borderRadius: RADIUS.small,
            padding: "14px 18px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <FaExclamationTriangle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Business Status & Metrics Banner (Existing Business Only) */}
      {isExisting && business && (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            boxShadow: SHADOWS.card,
            padding: "18px 24px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {/* Status Pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background:
                  business.status === "ACTIVE"
                    ? COLORS.successBg
                    : business.status === "SUSPENDED"
                    ? COLORS.warningBg
                    : COLORS.dangerBg,
                color:
                  business.status === "ACTIVE"
                    ? COLORS.success
                    : business.status === "SUSPENDED"
                    ? "#9A6200"
                    : COLORS.danger,
                border: `1px solid ${
                  business.status === "ACTIVE"
                    ? COLORS.successBorder
                    : business.status === "SUSPENDED"
                    ? COLORS.warningBorder
                    : COLORS.dangerBorder
                }`,
                padding: "5px 12px",
                borderRadius: RADIUS.pill,
                fontSize: "12px",
                fontWeight: "700"
              }}
            >
              <FaCheckCircle size={12} />
              <span>Status: {business.status || "ACTIVE"}</span>
            </span>

            {/* Rating Display */}
            {hasActualRating ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: COLORS.warningBg,
                  color: "#9A6200",
                  border: `1px solid ${COLORS.warningBorder}`,
                  padding: "5px 12px",
                  borderRadius: RADIUS.pill,
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                <FaStar color={COLORS.warning} size={11} />
                <span>{business.rating.toFixed(1)} / 5 Rating</span>
              </span>
            ) : (
              <span
                style={{
                  fontSize: "12px",
                  color: COLORS.muted,
                  background: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  padding: "5px 12px",
                  borderRadius: RADIUS.pill
                }}
              >
                No customer ratings yet
              </span>
            )}
          </div>

          <span style={{ fontSize: "12px", color: COLORS.muted }}>
            Registered on {formatCreatedDate(business.createdAt)}
          </span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* SECTION 1: Identity & Categorization */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: isMobile ? "20px 16px" : "28px 24px"
            }}
          >
            <h2
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaStore color={COLORS.primary} />
              <span>1. Business Identity</span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "18px"
              }}
            >
              {/* Business Name */}
              <InputField
                label="Business Name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="E.g., Glamour Unisex Salon"
                required
                error={fieldErrors.name}
              />

              {/* Category Dropdown */}
              <div style={{ marginBottom: "18px" }}>
                <label
                  htmlFor="biz-category-select"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: fieldErrors.category ? COLORS.danger : COLORS.secondary,
                    marginBottom: "6px"
                  }}
                >
                  Primary Category <span style={{ color: COLORS.danger }}>*</span>
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: COLORS.surface,
                    border: `1px solid ${
                      fieldErrors.category ? COLORS.danger : COLORS.border
                    }`,
                    borderRadius: RADIUS.small,
                    padding: "0 10px"
                  }}
                >
                  <FaTag color={COLORS.muted} size={13} style={{ marginRight: "8px" }} />
                  <select
                    id="biz-category-select"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 4px",
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      color: COLORS.text,
                      fontFamily: "inherit",
                      background: "transparent",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">-- Choose Category --</option>
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.category && (
                  <span style={{ color: COLORS.danger, fontSize: "12px", marginTop: "5px", display: "block" }}>
                    {fieldErrors.category}
                  </span>
                )}
              </div>
            </div>

            {/* Custom Category if "Other" is chosen */}
            {formData.category === "Other" && (
              <div style={{ marginTop: "4px" }}>
                <InputField
                  label="Specify Custom Category"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={(e) => handleChange("customCategory", e.target.value)}
                  placeholder="E.g., Dry Cleaning & Laundry"
                  required
                  error={fieldErrors.customCategory}
                />
              </div>
            )}

            {/* Business Description */}
            <div style={{ marginTop: "4px" }}>
              <label
                htmlFor="biz-description-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: COLORS.secondary,
                  marginBottom: "6px"
                }}
              >
                About Your Business (Optional)
              </label>
              <textarea
                id="biz-description-input"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your services, specialties, experience, and what makes your business unique..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: RADIUS.small,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "14px",
                  color: COLORS.text,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
              <span style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px", display: "block" }}>
                Customers will see this description on your public marketplace profile.
              </span>
            </div>
          </div>

          {/* SECTION 2: Contact & Online Presence */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: isMobile ? "20px 16px" : "28px 24px"
            }}
          >
            <h2
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaPhoneAlt color={COLORS.primary} />
              <span>2. Contact & Online Presence</span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "18px"
              }}
            >
              {/* Contact Phone */}
              <InputField
                label="Official Contact Number"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => handleChange("contactNumber", e.target.value)}
                placeholder="+91 98765 43210"
                icon={<FaPhoneAlt size={13} />}
                required
                error={fieldErrors.contactNumber}
                helperText="Primary phone for customer inquiries and booking coordination."
              />

              {/* Website */}
              <InputField
                label="Website or Social Link (Optional)"
                name="website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://example.com"
                icon={<FaGlobe size={13} />}
                error={fieldErrors.website}
                helperText="Direct link to your portfolio, booking portal, or website."
              />
            </div>
          </div>

          {/* SECTION 3: Location & Operating Hours */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: isMobile ? "20px 16px" : "28px 24px"
            }}
          >
            <h2
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaMapMarkerAlt color={COLORS.primary} />
              <span>3. Location & General Hours</span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
                gap: "18px"
              }}
            >
              {/* Street Address */}
              <InputField
                label="Street Address / Shop No."
                name="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="E.g., Shop 4, Galleria Market, Sector 28"
                icon={<FaMapMarkerAlt size={13} />}
                required
                error={fieldErrors.address}
              />

              {/* City */}
              <InputField
                label="City / District"
                name="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="E.g., Gurugram, Mumbai, Delhi"
                required
                error={fieldErrors.city}
              />
            </div>

            {/* General Operating Hours */}
            <div style={{ marginTop: "4px" }}>
              <InputField
                label="General Operating Hours Summary (Optional)"
                name="openingHours"
                value={formData.openingHours}
                onChange={(e) => handleChange("openingHours", e.target.value)}
                placeholder="E.g., Mon - Sat: 09:00 AM - 08:00 PM, Sun Closed"
                icon={<FaClock size={13} />}
                helperText="Summary displayed on your business profile card."
              />
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              paddingTop: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: COLORS.muted }}>
              <FaInfoCircle size={14} color={COLORS.primary} />
              <span>All changes reflect live in the APNA-BAZAR marketplace immediately upon saving.</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: isMobile ? "100%" : "auto" }}>
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  icon={<FaUndo />}
                  onClick={handleDiscard}
                  disabled={isSaving}
                  style={{ flex: isMobile ? 1 : "initial" }}
                >
                  Discard Changes
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={<FaSave />}
                loading={isSaving}
                disabled={isSaving}
                style={{ flex: isMobile ? 2 : "initial" }}
              >
                {isSaving
                  ? "Saving..."
                  : isExisting
                  ? "Save Profile Changes"
                  : "Create Business Profile"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ManageBusiness;
