import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  FaStore,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaEnvelope,
  FaStickyNote,
  FaArrowLeft,
  FaCheckCircle,
  FaCheck,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaShieldAlt,
  FaInfoCircle,
  FaRegEdit,
  FaMapMarkerAlt,
  FaCopy,
  FaRedoAlt,
  FaPhoneAlt
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  PAGE_WIDTH,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import businessService from "../../services/businessService";
import appointmentService from "../../services/appointmentService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

// Standard popular time slots for quick selection
const QUICK_TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00"
];

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function BookAppointment() {
  const { businessId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Pre-selected serviceId from query params
  const initialServiceId = searchParams.get("serviceId") || "";

  // Data fetching state
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [backendBlocker, setBackendBlocker] = useState(false);

  // Today in YYYY-MM-DD for min date
  const [todayStr] = useState(getTodayString);

  // Form input state
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  // Stepper: 1 = Configure, 2 = Review & Confirm
  const [step, setStep] = useState(1);

  // Validation & submission state
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitErrorType, setSubmitErrorType] = useState(null); // 'conflict' | 'closed' | 'duration' | 'auth' | 'general'
  const [conflictSlot, setConflictSlot] = useState(null); // { date, time }
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Fetch business profile and services
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!businessId) {
        setLoadError("Business identifier is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");
        setBackendBlocker(false);

        // Fetch Business profile
        const bizRes = await businessService.getBusinessById(businessId);
        const bizData = bizRes?.business || bizRes?.data || bizRes;

        if (isMounted) {
          if (!bizData || !bizData._id) {
            setLoadError("Business profile could not be found.");
            return;
          }
          setBusiness(bizData);
        }

        // Fetch Business services
        try {
          const srvRes = await businessService.getBusinessServices(businessId);
          if (isMounted) {
            const list = Array.isArray(srvRes?.services)
              ? srvRes.services
              : Array.isArray(srvRes?.data)
              ? srvRes.data
              : Array.isArray(srvRes)
              ? srvRes
              : [];
            
            const activeServices = list.filter((s) => s.isActive !== false);
            setServices(activeServices);

            // If initialServiceId is provided in URL, verify it exists
            if (initialServiceId && activeServices.some((s) => s._id === initialServiceId)) {
              setSelectedServiceId(initialServiceId);
            } else if (activeServices.length === 1) {
              // Auto-select if only 1 service exists
              setSelectedServiceId(activeServices[0]._id);
            }
          }
        } catch {
          if (isMounted) {
            setServices([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404 || !err.status) {
            setBackendBlocker(true);
          } else {
            setLoadError(
              err.customMessage ||
                err.message ||
                "Unable to connect with business services."
            );
          }
          setBusiness(null);
          setServices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [businessId, initialServiceId]);

  // Selected service object
  const selectedService = services.find((s) => s._id === selectedServiceId) || null;

  // Helpers
  function formatPrice(amount) {
    if (typeof amount !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDuration(minutes) {
    if (!minutes) return "Duration upon request";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} hr ${rem} mins` : `${hours} hr`;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return "Not selected";
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatTimeDisplay(timeStr) {
    if (!timeStr) return "Not selected";
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    const minPad = String(m).padStart(2, "0");
    return `${hour12}:${minPad} ${ampm} (${timeStr})`;
  }

  // Copy reference ID helper
  async function handleCopyRef(refId) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(refId);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2200);
      }
    } catch {
      // Fallback
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2200);
    }
  }

  // Reset form to book another appointment with same business
  function handleBookAnother() {
    setConfirmedBooking(null);
    setSelectedTime("");
    setNotes("");
    setFieldErrors({});
    setSubmitError("");
    setSubmitErrorType(null);
    setConflictSlot(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Validate Step 1 Inputs
  function validateStep1() {
    const errs = {};

    if (!selectedServiceId) {
      errs.service = "Please select a service for this appointment.";
    }

    if (!selectedDate) {
      errs.date = "Please select an appointment date.";
    } else {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(selectedDate)) {
        errs.date = "Date must be in valid YYYY-MM-DD format.";
      } else if (selectedDate < todayStr) {
        errs.date = "Appointment cannot be booked for a past date.";
      }
    }

    if (!selectedTime) {
      errs.time = "Please choose a time slot.";
    } else {
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timePattern.test(selectedTime)) {
        errs.time = "Time must be in valid 24-hr HH:mm format (e.g. 10:30).";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Handle Review Button Click
  function handleProceedToReview() {
    setSubmitError("");
    setSubmitErrorType(null);
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Handle Real Booking Submission (Day 10 Integration)
  async function handleConfirmBooking() {
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      setSubmitErrorType(null);

      const payload = {
        businessId,
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || undefined
      };

      const res = await appointmentService.createAppointment(payload);
      const appointment = res?.data || res?.appointment || res;
      setConfirmedBooking(appointment);
      setConflictSlot(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const status = err.status;
      const rawMsg =
        err.customMessage ||
        err.message ||
        "Failed to reserve appointment. Please try a different slot.";

      if (status === 409) {
        // Conflict: Slot already reserved
        setSubmitErrorType("conflict");
        setConflictSlot({ date: selectedDate, time: selectedTime });
        setSubmitError(
          `The time slot at ${selectedTime} on ${formatDateDisplay(selectedDate)} is already booked. Please choose an alternative slot.`
        );
        setFieldErrors((prev) => ({
          ...prev,
          time: "This time slot is taken. Please select another slot below."
        }));
        // Return user to Step 1 to select an alternate slot smoothly
        setStep(1);
      } else if (status === 400 && rawMsg.toLowerCase().includes("closed")) {
        // Business closed on selected weekday
        setSubmitErrorType("closed");
        setSubmitError(rawMsg);
        setFieldErrors((prev) => ({
          ...prev,
          date: "The merchant is closed on this weekday. Please select another date."
        }));
        setStep(1);
      } else if (status === 400 && rawMsg.toLowerCase().includes("finish within")) {
        // Service duration exceeds closing time
        setSubmitErrorType("duration");
        setSubmitError(rawMsg);
        setFieldErrors((prev) => ({
          ...prev,
          time: "Selected service duration exceeds business hours. Please choose an earlier time."
        }));
        setStep(1);
      } else if (status === 401) {
        // Session expired
        setSubmitErrorType("auth");
        setSubmitError("Your session has expired. Please sign in again to finalize your booking.");
      } else {
        setSubmitErrorType("general");
        setSubmitError(rawMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading Screen
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          padding: "40px"
        }}
      >
        <Loader size="lg" message="Loading business booking details..." />
      </div>
    );
  }

  // Backend Blocker State
  if (backendBlocker) {
    return (
      <div
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isMobile ? "24px 16px 64px" : "40px 28px 80px",
          boxSizing: "border-box"
        }}
      >
        <Button
          variant="outline"
          size="sm"
          icon={<FaArrowLeft />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: "24px" }}
        >
          Back
        </Button>

        <div
          style={{
            background: COLORS.warningBg,
            border: `1px solid ${COLORS.warningBorder}`,
            borderRadius: RADIUS.medium,
            padding: isMobile ? "30px 20px" : "48px 36px",
            textAlign: "center",
            maxWidth: "680px",
            margin: "40px auto 0"
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: RADIUS.round,
              background: COLORS.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: SHADOWS.card
            }}
          >
            <FaInfoCircle size={28} color={COLORS.warning} />
          </div>

          <h2
            style={{
              ...TYPOGRAPHY.h3,
              color: COLORS.secondary,
              margin: "0 0 12px"
            }}
          >
            Merchant Profile Pending Backend Activation
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              lineHeight: "1.6",
              maxWidth: "520px",
              margin: "0 auto 24px"
            }}
          >
            The backend endpoint <code>GET /api/business/{businessId}</code> is currently
            pending implementation. In accordance with platform standards, no mock
            businesses or simulated bookings are shown.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap"
            }}
          >
            <Link to="/explore" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="md">
                Explore Active Businesses
              </Button>
            </Link>
            <Link to="/my-appointments" style={{ textDecoration: "none" }}>
              <Button variant="outline" size="md">
                My Appointments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError || !business) {
    return (
      <div
        style={{
          maxWidth: PAGE_WIDTH,
          margin: "0 auto",
          padding: isMobile ? "24px 16px 64px" : "40px 28px 80px",
          boxSizing: "border-box"
        }}
      >
        <Button
          variant="outline"
          size="sm"
          icon={<FaArrowLeft />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: "24px" }}
        >
          Back
        </Button>

        <div
          style={{
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            borderRadius: RADIUS.medium,
            padding: "36px 24px",
            textAlign: "center",
            maxWidth: "600px",
            margin: "40px auto 0"
          }}
        >
          <FaExclamationTriangle
            size={36}
            color={COLORS.danger}
            style={{ marginBottom: "14px" }}
          />
          <h2
            style={{
              ...TYPOGRAPHY.h3,
              color: COLORS.secondary,
              margin: "0 0 10px"
            }}
          >
            Unable to Load Booking Interface
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              marginBottom: "24px"
            }}
          >
            {loadError || "The requested merchant is not available for appointments."}
          </p>
          <Link to="/explore" style={{ textDecoration: "none" }}>
            <Button variant="primary">Return to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Successful Booking Confirmation Screen (Day 10)
  if (confirmedBooking) {
    const bookingId = confirmedBooking._id || "NEW-APPT";
    const displayRef = `#${bookingId.slice(-8).toUpperCase()}`;

    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: isMobile ? "28px 16px 64px" : "48px 24px 80px",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "32px 20px" : "48px 40px",
            textAlign: "center"
          }}
        >
          {/* Success Icon */}
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: RADIUS.round,
              background: COLORS.successBg,
              color: COLORS.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "38px",
              margin: "0 auto 20px",
              border: `2px solid ${COLORS.successBorder}`,
              boxShadow: "0 4px 14px rgba(22, 163, 106, 0.15)"
            }}
          >
            <FaCheckCircle />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: COLORS.primaryBg,
              color: COLORS.primaryDark,
              fontSize: "12px",
              fontWeight: "700",
              padding: "5px 14px",
              borderRadius: RADIUS.pill,
              letterSpacing: "0.04em",
              marginBottom: "12px"
            }}
          >
            <span>CONFIRMATION REFERENCE:</span>
            <strong>{displayRef}</strong>
          </div>

          <h1
            style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.secondary,
              margin: "0 0 10px",
              fontSize: isMobile ? "24px" : "32px"
            }}
          >
            Appointment Booked Successfully!
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: COLORS.textSecondary,
              lineHeight: "1.6",
              maxWidth: "560px",
              margin: "0 auto 28px"
            }}
          >
            Your appointment has been registered and is pending confirmation from{" "}
            <strong>{business.name}</strong>. You will pay the provider directly at
            the venue upon service completion.
          </p>

          {/* Booking Summary Box */}
          <div
            style={{
              background: COLORS.surfaceSubtle,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              padding: isMobile ? "20px 16px" : "28px 24px",
              textAlign: "left",
              marginBottom: "28px"
            }}
          >
            {/* Top Reference Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
                paddingBottom: "16px",
                marginBottom: "18px",
                borderBottom: `1px solid ${COLORS.border}`
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: COLORS.muted, display: "block" }}>
                  Appointment ID
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "13px",
                    color: COLORS.secondary,
                    fontWeight: "600"
                  }}
                >
                  {bookingId}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyRef(bookingId)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.xs,
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: copiedRef ? COLORS.success : COLORS.textSecondary,
                  cursor: "pointer",
                  transition: `all ${TRANSITIONS.fast}`
                }}
              >
                {copiedRef ? <FaCheck color={COLORS.success} /> : <FaCopy />}
                <span>{copiedRef ? "Copied ID!" : "Copy Reference"}</span>
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "18px",
                fontSize: "14px"
              }}
            >
              <div>
                <span style={{ color: COLORS.muted, fontSize: "11px", textTransform: "uppercase", display: "block" }}>
                  Merchant
                </span>
                <strong style={{ color: COLORS.secondary, fontSize: "15px" }}>
                  {business.name}
                </strong>
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: COLORS.textSecondary,
                    marginTop: "2px"
                  }}
                >
                  {business.address}, {business.city}
                </span>
                {business.contactNumber && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "12px",
                      color: COLORS.primary,
                      marginTop: "4px"
                    }}
                  >
                    <FaPhoneAlt size={10} /> {business.contactNumber}
                  </span>
                )}
              </div>

              <div>
                <span style={{ color: COLORS.muted, fontSize: "11px", textTransform: "uppercase", display: "block" }}>
                  Service
                </span>
                <strong style={{ color: COLORS.secondary, fontSize: "15px" }}>
                  {selectedService?.name || "Service"}
                </strong>
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: COLORS.primary,
                    fontWeight: "700",
                    marginTop: "2px"
                  }}
                >
                  {formatPrice(confirmedBooking.price || selectedService?.price)} ({formatDuration(selectedService?.duration)})
                </span>
              </div>

              <div>
                <span style={{ color: COLORS.muted, fontSize: "11px", textTransform: "uppercase", display: "block" }}>
                  Date & Time
                </span>
                <strong style={{ color: COLORS.secondary }}>
                  {formatDateDisplay(selectedDate)}
                </strong>
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: COLORS.textSecondary,
                    marginTop: "2px"
                  }}
                >
                  {formatTimeDisplay(selectedTime)}
                </span>
              </div>

              <div>
                <span style={{ color: COLORS.muted, fontSize: "11px", textTransform: "uppercase", display: "block" }}>
                  Booking Status
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: COLORS.warningBg,
                    color: "#9A6200",
                    border: `1px solid ${COLORS.warningBorder}`,
                    padding: "4px 12px",
                    borderRadius: RADIUS.pill,
                    fontSize: "12px",
                    fontWeight: "700",
                    marginTop: "4px"
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: RADIUS.round,
                      background: COLORS.warning
                    }}
                  />
                  {confirmedBooking.status || "PENDING"} (Awaiting Confirmation)
                </span>
              </div>
            </div>

            {notes && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop: `1px dashed ${COLORS.border}`,
                  fontSize: "13px"
                }}
              >
                <span style={{ color: COLORS.muted, display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                  Your Special Notes
                </span>
                <p style={{ margin: "4px 0 0", color: COLORS.textSecondary, fontStyle: "italic" }}>
                  &ldquo;{notes}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Cancellation Notice */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "13px",
              color: COLORS.muted,
              marginBottom: "32px"
            }}
          >
            <FaShieldAlt color={COLORS.success} />
            <span>
              Free cancellation is available in your appointments manager until confirmation.
            </span>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: isMobile ? "column" : "row",
              gap: "12px"
            }}
          >
            <Link to="/my-appointments" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="lg" style={{ width: isMobile ? "100%" : "auto" }}>
                View in My Appointments
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              icon={<FaRedoAlt />}
              onClick={handleBookAnother}
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              Book Another Service
            </Button>

            <Link to="/explore" style={{ textDecoration: "none" }}>
              <Button variant="outline" size="lg" style={{ width: isMobile ? "100%" : "auto" }}>
                Explore Businesses
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: PAGE_WIDTH,
        margin: "0 auto",
        padding: isMobile ? "20px 16px 64px" : "36px 28px 80px",
        boxSizing: "border-box"
      }}
    >
      {/* Top Header & Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px"
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              navigate(`/business/${businessId}`);
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: COLORS.muted,
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            padding: "6px 0",
            transition: `color ${TRANSITIONS.fast}`
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.muted)}
        >
          <FaArrowLeft size={13} />
          {step === 2 ? "Back to Edit Details" : `Back to ${business.name}`}
        </button>

        {/* Stepper Pill Indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: COLORS.surfaceSubtle,
            border: `1px solid ${COLORS.border}`,
            padding: "4px 12px",
            borderRadius: RADIUS.pill,
            fontSize: "12px",
            fontWeight: "600",
            color: COLORS.textSecondary
          }}
        >
          <span
            style={{
              color: step === 1 ? COLORS.primary : COLORS.success,
              fontWeight: "700"
            }}
          >
            1. Select & Schedule
          </span>
          <span>&rarr;</span>
          <span
            style={{
              color: step === 2 ? COLORS.primary : COLORS.muted,
              fontWeight: step === 2 ? "700" : "500"
            }}
          >
            2. Review & Confirm
          </span>
        </div>
      </div>

      {/* Main Page Title */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            ...TYPOGRAPHY.h2,
            color: COLORS.secondary,
            margin: "0 0 8px",
            fontSize: isMobile ? "24px" : "32px"
          }}
        >
          {step === 1 ? "Book an Appointment" : "Review Your Appointment"}
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: COLORS.muted,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap"
          }}
        >
          <FaStore color={COLORS.primary} />
          <span>
            With <strong>{business.name}</strong> &bull; {business.address}, {business.city}
          </span>
        </p>
      </div>

      {/* Backend Submission Error Banner (Handles 409 Conflict, 400 Closed, 401 Auth) */}
      {submitError && (
        <div
          style={{
            background: submitErrorType === "conflict" ? COLORS.warningBg : COLORS.dangerBg,
            border: `1px solid ${
              submitErrorType === "conflict" ? COLORS.warningBorder : COLORS.dangerBorder
            }`,
            borderRadius: RADIUS.small,
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            color: submitErrorType === "conflict" ? "#9A6200" : COLORS.danger,
            fontSize: "14px"
          }}
        >
          <FaExclamationTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", marginBottom: "4px" }}>
              {submitErrorType === "conflict"
                ? "Slot Conflict Detected"
                : submitErrorType === "closed"
                ? "Merchant Unavailable on Selected Day"
                : submitErrorType === "duration"
                ? "Schedule Exceeds Operating Hours"
                : submitErrorType === "auth"
                ? "Authentication Required"
                : "Appointment Request Failed"}
            </div>
            <div>{submitError}</div>

            {submitErrorType === "auth" && (
              <div style={{ marginTop: "12px" }}>
                <Link to="/login" state={{ from: `/book/${businessId}?serviceId=${selectedServiceId}` }} style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="sm">
                    Log In Again
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "1fr 380px",
          gap: "32px",
          alignItems: "start"
        }}
      >
        {/* LEFT COLUMN: Booking Form Steps */}
        <div>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* SECTION 1: Service Selection */}
              <div
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.medium,
                  boxShadow: SHADOWS.card,
                  padding: isMobile ? "20px 16px" : "28px 24px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px"
                  }}
                >
                  <h2
                    style={{
                      ...TYPOGRAPHY.h4,
                      color: COLORS.secondary,
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span>1. Select Service</span>
                    <span style={{ color: COLORS.danger }}>*</span>
                  </h2>

                  {fieldErrors.service && (
                    <span style={{ color: COLORS.danger, fontSize: "12px", fontWeight: "600" }}>
                      {fieldErrors.service}
                    </span>
                  )}
                </div>

                {services.length === 0 ? (
                  <div
                    style={{
                      background: COLORS.surfaceSubtle,
                      border: `1px dashed ${COLORS.border}`,
                      borderRadius: RADIUS.small,
                      padding: "24px",
                      textAlign: "center",
                      color: COLORS.muted,
                      fontSize: "14px"
                    }}
                  >
                    No active services currently listed for this merchant.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {services.map((srv) => {
                      const isSelected = selectedServiceId === srv._id;
                      return (
                        <div
                          key={srv._id}
                          onClick={() => {
                            setSelectedServiceId(srv._id);
                            if (fieldErrors.service) {
                              setFieldErrors((prev) => ({ ...prev, service: "" }));
                            }
                          }}
                          style={{
                            border: `2px solid ${
                              isSelected ? COLORS.primary : COLORS.border
                            }`,
                            background: isSelected
                              ? COLORS.primaryBg
                              : COLORS.surface,
                            borderRadius: RADIUS.small,
                            padding: "16px 18px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "14px",
                            transition: `all ${TRANSITIONS.fast}`
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                            {/* Selection Radio Indicator */}
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: RADIUS.round,
                                border: `2px solid ${
                                  isSelected ? COLORS.primary : COLORS.borderDark
                                }`,
                                background: isSelected ? COLORS.primary : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                              }}
                            >
                              {isSelected && <FaCheck size={10} color="#FFFFFF" />}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: "700",
                                  fontSize: "15px",
                                  color: isSelected ? COLORS.primaryDark : COLORS.secondary
                                }}
                              >
                                {srv.name}
                              </div>
                              {srv.description && (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: COLORS.muted,
                                    marginTop: "2px"
                                  }}
                                >
                                  {srv.description}
                                </div>
                              )}
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  fontSize: "12px",
                                  color: COLORS.textSecondary,
                                  marginTop: "6px"
                                }}
                              >
                                <FaClock size={11} color={COLORS.muted} />
                                <span>{formatDuration(srv.duration)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Service Price */}
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: "800",
                                color: isSelected ? COLORS.primaryDark : COLORS.secondary
                              }}
                            >
                              {formatPrice(srv.price)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: Date & Time Slot Picker */}
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
                  <FaCalendarAlt color={COLORS.primary} />
                  <span>2. Select Date & Time</span>
                  <span style={{ color: COLORS.danger }}>*</span>
                </h2>

                {/* Date Input */}
                <div style={{ marginBottom: "22px" }}>
                  <label
                    htmlFor="booking-date-picker"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: fieldErrors.date ? COLORS.danger : COLORS.secondary,
                      marginBottom: "6px"
                    }}
                  >
                    Appointment Date (YYYY-MM-DD)
                  </label>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: COLORS.surface,
                      border: `1px solid ${
                        fieldErrors.date ? COLORS.danger : COLORS.border
                      }`,
                      borderRadius: RADIUS.small,
                      padding: "10px 14px",
                      boxSizing: "border-box"
                    }}
                  >
                    <input
                      id="booking-date-picker"
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        if (fieldErrors.date) {
                          setFieldErrors((prev) => ({ ...prev, date: "" }));
                        }
                      }}
                      style={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        fontSize: "14px",
                        color: COLORS.text,
                        fontFamily: "inherit",
                        background: "transparent"
                      }}
                    />
                  </div>

                  {fieldErrors.date ? (
                    <span
                      style={{
                        color: COLORS.danger,
                        fontSize: "12px",
                        marginTop: "5px",
                        display: "block"
                      }}
                    >
                      {fieldErrors.date}
                    </span>
                  ) : (
                    <span
                      style={{
                        color: COLORS.muted,
                        fontSize: "12px",
                        marginTop: "4px",
                        display: "block"
                      }}
                    >
                      Selected: {formatDateDisplay(selectedDate)}
                    </span>
                  )}
                </div>

                {/* Time Selection */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px"
                    }}
                  >
                    <label
                      htmlFor="booking-time-picker"
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: fieldErrors.time ? COLORS.danger : COLORS.secondary
                      }}
                    >
                      Time Slot (24-Hour format HH:mm)
                    </label>

                    {fieldErrors.time && (
                      <span style={{ color: COLORS.danger, fontSize: "12px" }}>
                        {fieldErrors.time}
                      </span>
                    )}
                  </div>

                  {/* Conflict Notice if previous attempt conflicted */}
                  {conflictSlot && conflictSlot.date === selectedDate && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9A6200",
                        background: COLORS.warningBg,
                        border: `1px solid ${COLORS.warningBorder}`,
                        padding: "6px 10px",
                        borderRadius: RADIUS.xs,
                        marginBottom: "10px"
                      }}
                    >
                      Slot <strong>{conflictSlot.time}</strong> is occupied on this date. Please select a different slot.
                    </div>
                  )}

                  {/* Quick Slot Buttons */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "14px"
                    }}
                  >
                    {QUICK_TIME_SLOTS.map((slot) => {
                      const isSlotSelected = selectedTime === slot;
                      const isConflicted =
                        conflictSlot &&
                        conflictSlot.date === selectedDate &&
                        conflictSlot.time === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedTime(slot);
                            if (fieldErrors.time) {
                              setFieldErrors((prev) => ({ ...prev, time: "" }));
                            }
                          }}
                          style={{
                            padding: "7px 12px",
                            borderRadius: RADIUS.xs,
                            fontSize: "13px",
                            fontWeight: isSlotSelected ? "700" : "500",
                            border: `1px solid ${
                              isConflicted
                                ? COLORS.dangerBorder
                                : isSlotSelected
                                ? COLORS.primary
                                : COLORS.border
                            }`,
                            background: isSlotSelected
                              ? COLORS.primary
                              : isConflicted
                              ? COLORS.dangerBg
                              : COLORS.surfaceSubtle,
                            color: isSlotSelected
                              ? "#FFFFFF"
                              : isConflicted
                              ? COLORS.danger
                              : COLORS.textSecondary,
                            cursor: "pointer",
                            transition: `all ${TRANSITIONS.fast}`
                          }}
                          title={isConflicted ? "Slot already booked on this date" : undefined}
                        >
                          {slot} {isConflicted && "(Taken)"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Time Picker */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: COLORS.surfaceSubtle,
                      border: `1px solid ${
                        fieldErrors.time ? COLORS.danger : COLORS.border
                      }`,
                      borderRadius: RADIUS.small,
                      padding: "8px 12px"
                    }}
                  >
                    <FaClock color={COLORS.muted} size={14} />
                    <input
                      id="booking-time-picker"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => {
                        setSelectedTime(e.target.value);
                        if (fieldErrors.time) {
                          setFieldErrors((prev) => ({ ...prev, time: "" }));
                        }
                      }}
                      style={{
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        color: COLORS.text,
                        fontFamily: "inherit",
                        background: "transparent",
                        width: "120px"
                      }}
                    />
                    <span style={{ fontSize: "12px", color: COLORS.muted }}>
                      Custom Time &bull; Current: {formatTimeDisplay(selectedTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Customer Information & Notes */}
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
                    margin: "0 0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <FaUser color={COLORS.primary} />
                  <span>3. Customer Details & Notes</span>
                </h2>

                {/* Logged in user info */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "14px",
                    background: COLORS.surfaceSubtle,
                    padding: "14px 16px",
                    borderRadius: RADIUS.small,
                    border: `1px solid ${COLORS.border}`,
                    marginBottom: "18px"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, display: "block" }}>
                      Customer Name
                    </span>
                    <strong style={{ fontSize: "14px", color: COLORS.secondary }}>
                      {user?.name || "Customer Account"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", color: COLORS.muted, display: "block" }}>
                      Customer Email
                    </span>
                    <strong style={{ fontSize: "14px", color: COLORS.secondary }}>
                      {user?.email || "Signed In"}
                    </strong>
                  </div>
                </div>

                {/* Additional Notes Textarea */}
                <div>
                  <label
                    htmlFor="booking-notes"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: COLORS.secondary,
                      marginBottom: "6px"
                    }}
                  >
                    Special Instructions / Notes (Optional)
                  </label>
                  <textarea
                    id="booking-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Preferred stylist, specific requirements, or venue instructions..."
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
                </div>
              </div>

              {/* Proceed to Review CTA */}
              <div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProceedToReview}
                  style={{ width: "100%", padding: "16px" }}
                >
                  Proceed to Review Booking
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Review & Final Confirmation */}
          {step === 2 && (
            <div
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.medium,
                boxShadow: SHADOWS.card,
                padding: isMobile ? "24px 18px" : "32px 28px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                <div>
                  <h2
                    style={{
                      ...TYPOGRAPHY.h3,
                      color: COLORS.secondary,
                      margin: "0 0 4px"
                    }}
                  >
                    Review & Confirm Details
                  </h2>
                  <p style={{ margin: 0, fontSize: "14px", color: COLORS.muted }}>
                    Please verify your appointment schedule before confirming.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={<FaRegEdit />}
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Edit
                </Button>
              </div>

              {/* Summary Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Merchant */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px"
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: RADIUS.small,
                      background: COLORS.primaryBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: COLORS.primary,
                      flexShrink: 0
                    }}
                  >
                    <FaStore />
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: COLORS.muted, display: "block" }}>
                      Merchant
                    </span>
                    <strong style={{ fontSize: "16px", color: COLORS.secondary }}>
                      {business.name}
                    </strong>
                    <div style={{ fontSize: "13px", color: COLORS.textSecondary, marginTop: "2px" }}>
                      {business.address}, {business.city}
                    </div>
                  </div>
                </div>

                {/* Service */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px"
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: RADIUS.small,
                      background: COLORS.primaryBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: COLORS.primary,
                      flexShrink: 0
                    }}
                  >
                    <FaMoneyBillWave />
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: COLORS.muted, display: "block" }}>
                      Selected Service
                    </span>
                    <strong style={{ fontSize: "16px", color: COLORS.secondary }}>
                      {selectedService?.name}
                    </strong>
                    <div style={{ fontSize: "13px", color: COLORS.primary, fontWeight: "600", marginTop: "2px" }}>
                      {formatPrice(selectedService?.price)} &bull; {formatDuration(selectedService?.duration)}
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px"
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: RADIUS.small,
                      background: COLORS.primaryBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: COLORS.primary,
                      flexShrink: 0
                    }}
                  >
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: COLORS.muted, display: "block" }}>
                      Schedule
                    </span>
                    <strong style={{ fontSize: "15px", color: COLORS.secondary }}>
                      {formatDateDisplay(selectedDate)}
                    </strong>
                    <div style={{ fontSize: "13px", color: COLORS.textSecondary, marginTop: "2px" }}>
                      {formatTimeDisplay(selectedTime)}
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px"
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: RADIUS.small,
                      background: COLORS.primaryBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: COLORS.primary,
                      flexShrink: 0
                    }}
                  >
                    <FaEnvelope />
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: COLORS.muted, display: "block" }}>
                      Customer Contact
                    </span>
                    <strong style={{ fontSize: "15px", color: COLORS.secondary }}>
                      {user?.name}
                    </strong>
                    <div style={{ fontSize: "13px", color: COLORS.textSecondary, marginTop: "2px" }}>
                      {user?.email}
                    </div>
                  </div>
                </div>

                {/* Notes (if any) */}
                {notes && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: RADIUS.small,
                        background: COLORS.primaryBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: COLORS.primary,
                        flexShrink: 0
                      }}
                    >
                      <FaStickyNote />
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: COLORS.muted, display: "block" }}>
                        Special Notes
                      </span>
                      <p style={{ margin: "2px 0 0", fontSize: "14px", color: COLORS.textSecondary, fontStyle: "italic" }}>
                        &ldquo;{notes}&rdquo;
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Policy note */}
              <div
                style={{
                  background: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.small,
                  padding: "14px 16px",
                  marginTop: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  color: COLORS.textSecondary
                }}
              >
                <FaShieldAlt color={COLORS.success} size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Zero-Risk Booking:</strong> No prepayment required. You pay the venue directly upon service completion. Free cancellation is permitted prior to confirmation.
                </span>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  marginTop: "28px"
                }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  Back to Edit
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleConfirmBooking}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  icon={<FaCheckCircle />}
                  style={{ flex: 2 }}
                >
                  {isSubmitting ? "Reserving Slot..." : "Confirm & Book Appointment"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Dynamic Booking Summary Card */}
        <div>
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.medium,
              boxShadow: SHADOWS.card,
              padding: "24px",
              position: isCompact ? "static" : "sticky",
              top: "24px"
            }}
          >
            <h3
              style={{
                ...TYPOGRAPHY.h4,
                color: COLORS.secondary,
                margin: "0 0 16px",
                paddingBottom: "12px",
                borderBottom: `1px solid ${COLORS.border}`
              }}
            >
              Booking Summary
            </h3>

            {/* Merchant Details */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                Merchant
              </span>
              <strong style={{ fontSize: "15px", color: COLORS.secondary }}>
                {business.name}
              </strong>
              <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                <FaMapMarkerAlt size={10} color={COLORS.primary} />
                <span>{business.city}</span>
              </div>
            </div>

            {/* Selected Service */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                Service
              </span>
              {selectedService ? (
                <div>
                  <strong style={{ fontSize: "14px", color: COLORS.secondary }}>
                    {selectedService.name}
                  </strong>
                  <div style={{ fontSize: "12px", color: COLORS.textSecondary, marginTop: "2px" }}>
                    Duration: {formatDuration(selectedService.duration)}
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: "13px", color: COLORS.muted, fontStyle: "italic" }}>
                  None selected
                </span>
              )}
            </div>

            {/* Schedule */}
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                Date & Time
              </span>
              <div style={{ fontSize: "13px", color: selectedDate ? COLORS.secondary : COLORS.muted, fontWeight: selectedDate ? "600" : "400" }}>
                {formatDateDisplay(selectedDate)}
              </div>
              <div style={{ fontSize: "12px", color: selectedTime ? COLORS.primaryDark : COLORS.muted, fontWeight: selectedTime ? "600" : "400", marginTop: "2px" }}>
                {selectedTime ? formatTimeDisplay(selectedTime) : "Time not chosen"}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                paddingTop: "14px",
                marginBottom: "20px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: COLORS.textSecondary,
                  marginBottom: "8px"
                }}
              >
                <span>Service Fee</span>
                <span>{formatPrice(selectedService?.price || 0)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: COLORS.textSecondary,
                  marginBottom: "8px"
                }}
              >
                <span>Platform Booking Fee</span>
                <span style={{ color: COLORS.success, fontWeight: "600" }}>₹0 (Free)</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: "800",
                  color: COLORS.secondary,
                  paddingTop: "10px",
                  borderTop: `1px dashed ${COLORS.border}`
                }}
              >
                <span>Total Amount</span>
                <span style={{ color: COLORS.primaryDark }}>
                  {formatPrice(selectedService?.price || 0)}
                </span>
              </div>

              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: COLORS.muted,
                  marginTop: "6px"
                }}
              >
                Pay directly at the venue after service completion.
              </span>
            </div>

            {/* Step 1 Quick Action from Summary */}
            {step === 1 && (
              <Button
                variant="primary"
                size="md"
                onClick={handleProceedToReview}
                style={{ width: "100%" }}
              >
                Review Booking Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookAppointment;
