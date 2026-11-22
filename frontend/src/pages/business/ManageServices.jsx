import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaInfoCircle,
  FaSearch,
  FaStore,
  FaTag
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import businessService from "../../services/businessService";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Loader from "../../components/Loader";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

function ManageServices() {
  const { isMobile } = useResponsive();

  // Data fetching state
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNoBusiness, setHasNoBusiness] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [serviceModal, setServiceModal] = useState({
    isOpen: false,
    mode: "create", // "create" | "edit"
    serviceId: null
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: 30
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    service: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Load services initially
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        setHasNoBusiness(false);
        const res = await businessService.getMyServices();
        const list = Array.isArray(res?.services)
          ? res.services
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        if (isMounted) {
          setServices(list);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404) {
            setHasNoBusiness(true);
          } else {
            setLoadError(
              err.customMessage ||
                err.message ||
                "Failed to load business services."
            );
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh handler
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      setHasNoBusiness(false);
      const res = await businessService.getMyServices();
      const list = Array.isArray(res?.services)
        ? res.services
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setServices(list);
    } catch (err) {
      if (err.status === 404) {
        setHasNoBusiness(true);
      } else {
        setLoadError(
          err.customMessage ||
            err.message ||
            "Failed to load business services."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Format Helpers
  function formatPrice(amount) {
    if (typeof amount !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDuration(minutes) {
    if (!minutes) return "Standard duration";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} hr ${rem} mins` : `${hours} hr`;
  }

  // Open Create Service Modal
  function handleOpenCreate() {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: 30
    });
    setFormErrors({});
    setServiceModal({
      isOpen: true,
      mode: "create",
      serviceId: null
    });
  }

  // Open Edit Service Modal
  function handleOpenEdit(srv) {
    setFormData({
      name: srv.name || "",
      description: srv.description || "",
      price: typeof srv.price === "number" ? String(srv.price) : "",
      duration: typeof srv.duration === "number" ? srv.duration : 30
    });
    setFormErrors({});
    setServiceModal({
      isOpen: true,
      mode: "edit",
      serviceId: srv._id
    });
  }

  // Form Field Validation
  function validateForm() {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = "Service name is required.";
    }

    const priceNum = Number(formData.price);
    if (formData.price === "" || isNaN(priceNum) || priceNum < 0) {
      errs.price = "Enter a valid non-negative price.";
    }

    const durNum = Number(formData.duration);
    if (!Number.isInteger(durNum) || durNum < 1) {
      errs.duration = "Duration must be at least 1 minute.";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Handle Create or Edit Submit
  async function handleSubmitService(e) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        duration: Number(formData.duration)
      };

      if (serviceModal.mode === "create") {
        const res = await businessService.createService(payload);
        const createdSrv = res?.service || res?.data || res;
        setServices((prev) => [createdSrv, ...prev]);
        showToast(`Service "${createdSrv.name}" created successfully!`);
      } else {
        const res = await businessService.updateService(serviceModal.serviceId, payload);
        const updatedSrv = res?.service || res?.data || res;
        setServices((prev) =>
          prev.map((item) =>
            item._id === serviceModal.serviceId ? updatedSrv : item
          )
        );
        showToast(`Service "${updatedSrv.name}" updated successfully!`);
      }

      setServiceModal({ isOpen: false, mode: "create", serviceId: null });
    } catch (err) {
      showToast(
        err.customMessage ||
          err.message ||
          "Failed to save service. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!deleteModal.service?._id) return;

    try {
      setIsDeleting(true);
      const srvId = deleteModal.service._id;
      const srvName = deleteModal.service.name;

      await businessService.deleteService(srvId);
      setServices((prev) => prev.filter((item) => item._id !== srvId));
      setDeleteModal({ isOpen: false, service: null });
      showToast(`Service "${srvName}" has been deleted.`);
    } catch (err) {
      showToast(
        err.customMessage ||
          err.message ||
          "Failed to delete service.",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // Filtered Services List
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  // Catalog Metrics
  const metrics = useMemo(() => {
    const total = services.length;
    let totalPrice = 0;
    services.forEach((s) => {
      if (typeof s.price === "number") totalPrice += s.price;
    });
    const avgPrice = total > 0 ? Math.round(totalPrice / total) : 0;
    return { total, avgPrice };
  }, [services]);

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
        <Loader size="lg" message="Loading business services..." />
      </div>
    );
  }

  // Blocker: If business profile is not yet created
  if (hasNoBusiness) {
    return (
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.card,
          padding: isMobile ? "32px 20px" : "56px 40px",
          textAlign: "center",
          maxWidth: "620px",
          margin: "40px auto 0"
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: RADIUS.round,
            background: COLORS.primaryBg,
            color: COLORS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            margin: "0 auto 20px"
          }}
        >
          <FaStore />
        </div>

        <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 10px" }}>
          Business Profile Required
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: COLORS.textSecondary,
            lineHeight: "1.6",
            maxWidth: "460px",
            margin: "0 auto 28px"
          }}
        >
          You must set up your business profile before you can list services and accept customer bookings on APNA-BAZAR.
        </p>

        <Link to="/business/manage" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg">
            Create Business Profile Now
          </Button>
        </Link>
      </div>
    );
  }

  // Load error screen
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
          Unable to Load Services
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={fetchServices}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Top Header */}
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
            Manage Services
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: COLORS.muted }}>
            Define, update, and manage the services and prices offered at your business.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<FaPlus />}
          onClick={handleOpenCreate}
        >
          Add New Service
        </Button>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            background: toast.type === "success" ? COLORS.successBg : COLORS.dangerBg,
            border: `1px solid ${
              toast.type === "success" ? COLORS.successBorder : COLORS.dangerBorder
            }`,
            color: toast.type === "success" ? COLORS.success : COLORS.danger,
            borderRadius: RADIUS.small,
            padding: "12px 18px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "18px",
          marginBottom: "28px"
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px 24px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.small,
              background: COLORS.primaryBg,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            <FaTag />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: COLORS.muted, fontWeight: "600", textTransform: "uppercase" }}>
              Active Services Listed
            </span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
              {metrics.total}
            </div>
          </div>
        </div>

        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "20px 24px",
            boxShadow: SHADOWS.card,
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: RADIUS.small,
              background: COLORS.successBg,
              color: COLORS.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            <FaClock />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: COLORS.muted, fontWeight: "600", textTransform: "uppercase" }}>
              Average Service Price
            </span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
              {formatPrice(metrics.avgPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {services.length > 0 && (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            boxShadow: SHADOWS.card,
            padding: "14px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <FaSearch color={COLORS.muted} size={14} />
          <input
            type="text"
            placeholder="Search your services by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: COLORS.text,
              background: "transparent",
              width: "100%",
              fontFamily: "inherit"
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                color: COLORS.muted,
                cursor: "pointer",
                padding: "4px"
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}

      {/* Services List / Empty State */}
      {services.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "36px 20px" : "60px 32px",
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: RADIUS.round,
              background: COLORS.primaryBg,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 18px"
            }}
          >
            <FaPlus />
          </div>

          <h2 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
            No Services Added Yet
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              lineHeight: "1.6",
              maxWidth: "460px",
              margin: "0 auto 24px"
            }}
          >
            List the appointments, treatments, or services you offer with their duration and pricing so customers can book them.
          </p>

          <Button variant="primary" size="lg" icon={<FaPlus />} onClick={handleOpenCreate}>
            Add Your First Service
          </Button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.medium,
            padding: "40px 24px",
            textAlign: "center",
            color: COLORS.muted
          }}
        >
          <p style={{ margin: "0 0 14px", fontSize: "14px" }}>
            No services match your search query &ldquo;{searchQuery}&rdquo;.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredServices.map((srv) => (
            <div
              key={srv._id}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.medium,
                boxShadow: SHADOWS.card,
                padding: isMobile ? "20px 16px" : "22px 24px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: "18px",
                transition: `all ${TRANSITIONS.fast}`
              }}
            >
              {/* Service Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: "700",
                      color: COLORS.secondary,
                      margin: 0
                    }}
                  >
                    {srv.name}
                  </h3>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: COLORS.success,
                      background: COLORS.successBg,
                      padding: "2px 8px",
                      borderRadius: RADIUS.pill
                    }}
                  >
                    Active
                  </span>
                </div>

                {srv.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: COLORS.textSecondary,
                      lineHeight: "1.5",
                      margin: "0 0 10px",
                      maxWidth: "680px"
                    }}
                  >
                    {srv.description}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      color: COLORS.muted,
                      fontWeight: "500"
                    }}
                  >
                    <FaClock size={12} />
                    {formatDuration(srv.duration)}
                  </span>

                  <span
                    style={{
                      fontSize: "17px",
                      fontWeight: "800",
                      color: COLORS.primaryDark
                    }}
                  >
                    {formatPrice(srv.price)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<FaEdit />}
                  onClick={() => handleOpenEdit(srv)}
                >
                  Edit
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  icon={<FaTrashAlt />}
                  onClick={() => setDeleteModal({ isOpen: true, service: srv })}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Service Modal */}
      {serviceModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 17, 35, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: RADIUS.large,
              boxShadow: SHADOWS.modal,
              padding: isMobile ? "24px 18px" : "32px 28px",
              maxWidth: "520px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                paddingBottom: "14px",
                borderBottom: `1px solid ${COLORS.border}`
              }}
            >
              <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: 0 }}>
                {serviceModal.mode === "create" ? "Add New Service" : "Edit Service"}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setServiceModal({ isOpen: false, mode: "create", serviceId: null })
                }
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.muted,
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "4px"
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitService}>
              {/* Service Name */}
              <InputField
                label="Service Name"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="E.g., Haircut & Beard Styling"
                required
                error={formErrors.name}
              />

              {/* Price & Duration Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px"
                }}
              >
                {/* Price */}
                <InputField
                  label="Price (₹ INR)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="E.g., 500"
                  required
                  error={formErrors.price}
                />

                {/* Duration */}
                <InputField
                  label="Duration (Minutes)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: Number(e.target.value) || 0
                    }))
                  }
                  placeholder="30"
                  required
                  error={formErrors.duration}
                />
              </div>

              {/* Duration Preset Chips */}
              <div style={{ marginBottom: "18px" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: COLORS.muted,
                    marginBottom: "6px"
                  }}
                >
                  Quick Duration Presets:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {DURATION_PRESETS.map((p) => {
                    const isSelected = formData.duration === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, duration: p }))
                        }
                        style={{
                          padding: "4px 10px",
                          borderRadius: RADIUS.xs,
                          fontSize: "12px",
                          fontWeight: isSelected ? "700" : "500",
                          border: `1px solid ${
                            isSelected ? COLORS.primary : COLORS.border
                          }`,
                          background: isSelected
                            ? COLORS.primary
                            : COLORS.surfaceSubtle,
                          color: isSelected ? "#FFFFFF" : COLORS.textSecondary,
                          cursor: "pointer",
                          transition: `all ${TRANSITIONS.fast}`
                        }}
                      >
                        {p} mins
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="srv-modal-description"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: COLORS.secondary,
                    marginBottom: "6px"
                  }}
                >
                  Description (Optional)
                </label>
                <textarea
                  id="srv-modal-description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                  placeholder="What is included in this service? Special instructions for the customer..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
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
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setServiceModal({ isOpen: false, mode: "create", serviceId: null })
                  }
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : serviceModal.mode === "create"
                    ? "Add Service"
                    : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.service && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 17, 35, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.modal,
              padding: isMobile ? "24px 18px" : "32px 28px",
              maxWidth: "460px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: RADIUS.round,
                background: COLORS.dangerBg,
                color: COLORS.danger,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "16px"
              }}
            >
              <FaTrashAlt />
            </div>

            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.secondary, margin: "0 0 8px" }}>
              Delete Service?
            </h3>

            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5", margin: "0 0 16px" }}>
              Are you sure you want to delete <strong>&ldquo;{deleteModal.service.name}&rdquo;</strong>?
              This service will no longer be available for customer bookings.
            </p>

            <div
              style={{
                background: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                padding: "10px 14px",
                borderRadius: RADIUS.xs,
                fontSize: "12px",
                color: COLORS.muted,
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaInfoCircle color={COLORS.primary} />
              <span>Existing scheduled appointments for this service will not be affected.</span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ isOpen: false, service: null })}
                disabled={isDeleting}
              >
                Keep Service
              </Button>

              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageServices;
