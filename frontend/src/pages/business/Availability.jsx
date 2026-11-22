import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaStore,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSave,
  FaUndo,
  FaInfoCircle,
  FaCopy,
  FaTrashAlt,
  FaCheck
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import availabilityService from "../../services/availabilityService";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

const WEEKDAYS = [
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
  { key: "SUNDAY", label: "Sunday", short: "Sun" }
];

const DEFAULT_SCHEDULE = {
  MONDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: false },
  TUESDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: false },
  WEDNESDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: false },
  THURSDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: false },
  FRIDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: false },
  SATURDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: false },
  SUNDAY: { isOpen: false, openingTime: "09:00", closingTime: "18:00", inDb: false }
};

function Availability() {
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Data fetching state
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [hasNoBusiness, setHasNoBusiness] = useState(false);
  const [loadError, setLoadError] = useState("");

  // UI state
  const [savingDay, setSavingDay] = useState(null); // dayKey being saved individually
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [dayErrors, setDayErrors] = useState({});
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [isDirty, setIsDirty] = useState(false);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }

  // Load schedule initially
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadError("");
        setHasNoBusiness(false);
        const res = await availabilityService.getMyAvailability();
        const list = Array.isArray(res?.availability)
          ? res.availability
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        if (isMounted) {
          const merged = { ...DEFAULT_SCHEDULE };
          list.forEach((item) => {
            if (item.day && merged[item.day]) {
              merged[item.day] = {
                isOpen: Boolean(item.isOpen),
                openingTime: item.openingTime || "09:00",
                closingTime: item.closingTime || "18:00",
                inDb: true
              };
            }
          });
          setSchedule(merged);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404) {
            setHasNoBusiness(true);
          } else {
            setLoadError(
              err.customMessage ||
                err.message ||
                "Failed to load business availability schedule."
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

  // Manual retry handler
  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      setHasNoBusiness(false);
      const res = await availabilityService.getMyAvailability();
      const list = Array.isArray(res?.availability)
        ? res.availability
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      const merged = { ...DEFAULT_SCHEDULE };
      list.forEach((item) => {
        if (item.day && merged[item.day]) {
          merged[item.day] = {
            isOpen: Boolean(item.isOpen),
            openingTime: item.openingTime || "09:00",
            closingTime: item.closingTime || "18:00",
            inDb: true
          };
        }
      });
      setSchedule(merged);
    } catch (err) {
      if (err.status === 404) {
        setHasNoBusiness(true);
      } else {
        setLoadError(
          err.customMessage ||
            err.message ||
            "Failed to load business availability schedule."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Format Helpers
  function formatTime12(timeStr) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    const minPad = String(m).padStart(2, "0");
    return `${hour12}:${minPad} ${ampm}`;
  }

  function calculateDailyHours(opening, closing) {
    if (!opening || !closing) return 0;
    const [h1, m1] = opening.split(":").map(Number);
    const [h2, m2] = closing.split(":").map(Number);
    const mins = h2 * 60 + m2 - (h1 * 60 + m1);
    return mins > 0 ? (mins / 60).toFixed(1) : 0;
  }

  // Handle Day Toggle (Open / Closed)
  function handleToggleOpen(dayKey) {
    setSchedule((prev) => {
      const current = prev[dayKey];
      return {
        ...prev,
        [dayKey]: {
          ...current,
          isOpen: !current.isOpen
        }
      };
    });
    setIsDirty(true);
    if (dayErrors[dayKey]) {
      setDayErrors((prev) => ({ ...prev, [dayKey]: "" }));
    }
  }

  // Handle Time Field Change
  function handleTimeChange(dayKey, field, value) {
    setSchedule((prev) => {
      const current = prev[dayKey];
      return {
        ...prev,
        [dayKey]: {
          ...current,
          [field]: value
        }
      };
    });
    setIsDirty(true);
    if (dayErrors[dayKey]) {
      setDayErrors((prev) => ({ ...prev, [dayKey]: "" }));
    }
  }

  // Validate a single day
  function validateDay(dayKey, data) {
    if (!data.isOpen) return true;

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!data.openingTime || !timePattern.test(data.openingTime)) {
      setDayErrors((prev) => ({
        ...prev,
        [dayKey]: "Opening time must be in valid HH:mm format."
      }));
      return false;
    }

    if (!data.closingTime || !timePattern.test(data.closingTime)) {
      setDayErrors((prev) => ({
        ...prev,
        [dayKey]: "Closing time must be in valid HH:mm format."
      }));
      return false;
    }

    if (data.closingTime <= data.openingTime) {
      setDayErrors((prev) => ({
        ...prev,
        [dayKey]: "Closing time must be strictly after opening time."
      }));
      return false;
    }

    return true;
  }

  // Save a single weekday
  async function handleSaveSingleDay(dayKey) {
    const dayData = schedule[dayKey];
    if (!validateDay(dayKey, dayData)) return;

    try {
      setSavingDay(dayKey);
      setDayErrors((prev) => ({ ...prev, [dayKey]: "" }));

      const payload = {
        day: dayKey,
        isOpen: dayData.isOpen,
        openingTime: dayData.openingTime,
        closingTime: dayData.closingTime
      };

      if (dayData.inDb) {
        await availabilityService.updateAvailability(dayKey, payload);
      } else {
        await availabilityService.createAvailability(payload);
      }

      setSchedule((prev) => ({
        ...prev,
        [dayKey]: { ...prev[dayKey], inDb: true }
      }));

      showToast(`Saved schedule for ${dayKey.charAt(0) + dayKey.slice(1).toLowerCase()}.`);
    } catch (err) {
      const msg =
        err.customMessage ||
        err.message ||
        `Failed to save schedule for ${dayKey}.`;
      setDayErrors((prev) => ({ ...prev, [dayKey]: msg }));
      showToast(msg, "error");
    } finally {
      setSavingDay(null);
    }
  }

  // Save entire 7-day schedule at once
  async function handleSaveAll() {
    // Validate all open days first
    let hasAnyError = false;
    for (const w of WEEKDAYS) {
      const dayData = schedule[w.key];
      if (!validateDay(w.key, dayData)) {
        hasAnyError = true;
      }
    }

    if (hasAnyError) {
      showToast("Please resolve timing errors before saving schedule.", "error");
      return;
    }

    try {
      setIsSavingAll(true);
      setDayErrors({});

      for (const w of WEEKDAYS) {
        const dayKey = w.key;
        const dayData = schedule[dayKey];
        const payload = {
          day: dayKey,
          isOpen: dayData.isOpen,
          openingTime: dayData.openingTime,
          closingTime: dayData.closingTime
        };

        if (dayData.inDb) {
          await availabilityService.updateAvailability(dayKey, payload);
        } else {
          try {
            await availabilityService.createAvailability(payload);
          } catch (createErr) {
            // If already exists on server, fallback to update
            if (createErr.status === 409) {
              await availabilityService.updateAvailability(dayKey, payload);
            } else {
              throw createErr;
            }
          }
        }
      }

      // Mark all days as inDb
      setSchedule((prev) => {
        const next = { ...prev };
        WEEKDAYS.forEach((w) => {
          next[w.key] = { ...next[w.key], inDb: true };
        });
        return next;
      });

      setIsDirty(false);
      showToast("Weekly availability schedule saved successfully!");
    } catch (err) {
      showToast(
        err.customMessage ||
          err.message ||
          "Failed to save weekly schedule.",
        "error"
      );
    } finally {
      setIsSavingAll(false);
    }
  }

  // Quick Action: Copy Monday Hours to All Weekdays (Mon - Fri)
  function handleCopyMondayToWeekdays() {
    const monday = schedule.MONDAY;
    setSchedule((prev) => ({
      ...prev,
      TUESDAY: { ...prev.TUESDAY, isOpen: monday.isOpen, openingTime: monday.openingTime, closingTime: monday.closingTime },
      WEDNESDAY: { ...prev.WEDNESDAY, isOpen: monday.isOpen, openingTime: monday.openingTime, closingTime: monday.closingTime },
      THURSDAY: { ...prev.THURSDAY, isOpen: monday.isOpen, openingTime: monday.openingTime, closingTime: monday.closingTime },
      FRIDAY: { ...prev.FRIDAY, isOpen: monday.isOpen, openingTime: monday.openingTime, closingTime: monday.closingTime }
    }));
    setIsDirty(true);
    showToast("Monday hours applied to Tuesday through Friday!");
  }

  // Quick Action: Reset to Standard (Mon-Sat 9-6, Sun Closed)
  function handleApplyStandardHours() {
    setSchedule({
      MONDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: schedule.MONDAY.inDb },
      TUESDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: schedule.TUESDAY.inDb },
      WEDNESDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: schedule.WEDNESDAY.inDb },
      THURSDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: schedule.THURSDAY.inDb },
      FRIDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: schedule.FRIDAY.inDb },
      SATURDAY: { isOpen: true, openingTime: "09:00", closingTime: "18:00", inDb: schedule.SATURDAY.inDb },
      SUNDAY: { isOpen: false, openingTime: "09:00", closingTime: "18:00", inDb: schedule.SUNDAY.inDb }
    });
    setIsDirty(true);
    setDayErrors({});
    showToast("Standard operating hours loaded (Mon-Sat 9am-6pm). Remember to Save!");
  }

  // Delete weekday record from server
  async function handleDeleteDaySchedule(dayKey) {
    if (!schedule[dayKey].inDb) return;

    try {
      setSavingDay(dayKey);
      await availabilityService.deleteAvailability(dayKey);
      setSchedule((prev) => ({
        ...prev,
        [dayKey]: { ...DEFAULT_SCHEDULE[dayKey], inDb: false }
      }));
      showToast(`Availability record removed for ${dayKey.charAt(0) + dayKey.slice(1).toLowerCase()}.`);
    } catch (err) {
      showToast(
        err.customMessage || err.message || "Failed to remove availability record.",
        "error"
      );
    } finally {
      setSavingDay(null);
    }
  }

  // Metrics calculation
  const metrics = useMemo(() => {
    let openCount = 0;
    let totalWeeklyHours = 0;

    WEEKDAYS.forEach((w) => {
      const s = schedule[w.key];
      if (s?.isOpen) {
        openCount++;
        const hours = Number(calculateDailyHours(s.openingTime, s.closingTime));
        totalWeeklyHours += isNaN(hours) ? 0 : hours;
      }
    });

    return {
      openDays: openCount,
      totalHours: totalWeeklyHours.toFixed(1)
    };
  }, [schedule]);

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
        <Loader size="lg" message="Loading weekly availability..." />
      </div>
    );
  }

  // Blocker: Business profile not registered
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
          Please set up your business profile before defining your weekly operational hours and availability schedule.
        </p>

        <Link to="/business/manage" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg">
            Create Business Profile Now
          </Button>
        </Link>
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
          Unable to Load Schedule
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.textSecondary, marginBottom: "20px" }}>
          {loadError}
        </p>
        <Button variant="primary" onClick={fetchAvailability}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Page Header */}
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
            Availability & Working Hours
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: COLORS.muted }}>
            Set your weekly operating schedule so customers can book appointments during your business hours.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="md"
            icon={<FaSave />}
            onClick={handleSaveAll}
            loading={isSavingAll}
            disabled={isSavingAll}
          >
            {isSavingAll ? "Saving Schedule..." : "Save All Schedule"}
          </Button>
        </div>
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

      {/* Metrics & Quick Setup Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "18px",
          marginBottom: "28px"
        }}
      >
        {/* Metric 1 */}
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
            <FaCalendarAlt />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: COLORS.muted, fontWeight: "600", textTransform: "uppercase" }}>
              Operating Days
            </span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
              {metrics.openDays} Days Open <span style={{ fontSize: "14px", color: COLORS.muted, fontWeight: "500" }}>/ 7 days</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
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
              Weekly Operating Time
            </span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.secondary, marginTop: "2px" }}>
              {metrics.totalHours} Hours <span style={{ fontSize: "14px", color: COLORS.muted, fontWeight: "500" }}>/ week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Setup Action Buttons */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.medium,
          boxShadow: SHADOWS.card,
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: COLORS.textSecondary }}>
          <FaInfoCircle color={COLORS.primary} />
          <span>Quick actions to configure weekly schedule:</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<FaCopy />}
            onClick={handleCopyMondayToWeekdays}
          >
            Apply Monday Hours to Weekdays
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<FaUndo />}
            onClick={handleApplyStandardHours}
          >
            Load Standard 9am - 6pm
          </Button>
        </div>
      </div>

      {/* Weekly Schedule Rows (Monday to Sunday) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {WEEKDAYS.map((w) => {
          const dayKey = w.key;
          const dayData = schedule[dayKey] || DEFAULT_SCHEDULE[dayKey];
          const hasError = Boolean(dayErrors[dayKey]);
          const isSaving = savingDay === dayKey;
          const dailyHours = calculateDailyHours(dayData.openingTime, dayData.closingTime);

          return (
            <div
              key={dayKey}
              style={{
                background: COLORS.surface,
                border: `1px solid ${hasError ? COLORS.danger : COLORS.border}`,
                borderRadius: RADIUS.medium,
                boxShadow: SHADOWS.card,
                padding: isMobile ? "18px 16px" : "20px 24px",
                display: "flex",
                flexDirection: isCompact ? "column" : "row",
                alignItems: isCompact ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: "18px",
                transition: `all ${TRANSITIONS.fast}`
              }}
            >
              {/* Left: Day & Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "18px", minWidth: "220px" }}>
                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleOpen(dayKey)}
                  aria-label={`Toggle ${w.label} open or closed`}
                  style={{
                    width: "48px",
                    height: "26px",
                    borderRadius: RADIUS.pill,
                    background: dayData.isOpen ? COLORS.primary : COLORS.borderDark,
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    padding: 0,
                    transition: `background ${TRANSITIONS.fast}`,
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: RADIUS.round,
                      background: "#FFFFFF",
                      position: "absolute",
                      top: "3px",
                      left: dayData.isOpen ? "25px" : "3px",
                      transition: `left ${TRANSITIONS.fast}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }}
                  />
                </button>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "16px", color: COLORS.secondary }}>
                      {w.label}
                    </strong>
                    {dayData.inDb && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: COLORS.primaryDark,
                          background: COLORS.primaryBg,
                          padding: "1px 6px",
                          borderRadius: RADIUS.xs
                        }}
                      >
                        Saved
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: dayData.isOpen ? COLORS.success : COLORS.muted
                    }}
                  >
                    {dayData.isOpen ? "Open for bookings" : "Closed"}
                  </span>
                </div>
              </div>

              {/* Middle: Timing Inputs or Closed Message */}
              <div style={{ flex: 1 }}>
                {dayData.isOpen ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    {/* Opening Time */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: COLORS.muted }}>From:</span>
                      <input
                        type="time"
                        value={dayData.openingTime}
                        onChange={(e) =>
                          handleTimeChange(dayKey, "openingTime", e.target.value)
                        }
                        style={{
                          padding: "8px 12px",
                          borderRadius: RADIUS.small,
                          border: `1px solid ${COLORS.border}`,
                          fontSize: "13px",
                          color: COLORS.text,
                          fontFamily: "inherit",
                          background: COLORS.surfaceSubtle,
                          outline: "none"
                        }}
                      />
                    </div>

                    <span style={{ color: COLORS.muted }}>&rarr;</span>

                    {/* Closing Time */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: COLORS.muted }}>To:</span>
                      <input
                        type="time"
                        value={dayData.closingTime}
                        onChange={(e) =>
                          handleTimeChange(dayKey, "closingTime", e.target.value)
                        }
                        style={{
                          padding: "8px 12px",
                          borderRadius: RADIUS.small,
                          border: `1px solid ${COLORS.border}`,
                          fontSize: "13px",
                          color: COLORS.text,
                          fontFamily: "inherit",
                          background: COLORS.surfaceSubtle,
                          outline: "none"
                        }}
                      />
                    </div>

                    {/* Formatted Hours Preview */}
                    <span
                      style={{
                        fontSize: "12px",
                        color: COLORS.textSecondary,
                        background: COLORS.surfaceSubtle,
                        padding: "5px 10px",
                        borderRadius: RADIUS.xs,
                        border: `1px solid ${COLORS.border}`
                      }}
                    >
                      {formatTime12(dayData.openingTime)} - {formatTime12(dayData.closingTime)} ({dailyHours} hrs)
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: "13px", color: COLORS.muted, fontStyle: "italic" }}>
                    No appointments will be accepted on {w.label}.
                  </span>
                )}

                {/* Day Error Message */}
                {hasError && (
                  <span
                    style={{
                      display: "block",
                      color: COLORS.danger,
                      fontSize: "12px",
                      fontWeight: "600",
                      marginTop: "6px"
                    }}
                  >
                    {dayErrors[dayKey]}
                  </span>
                )}
              </div>

              {/* Right: Individual Save & Delete Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={dayData.inDb ? <FaCheck /> : <FaSave />}
                  onClick={() => handleSaveSingleDay(dayKey)}
                  loading={isSaving}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : dayData.inDb ? "Update Day" : "Save Day"}
                </Button>

                {dayData.inDb && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDaySchedule(dayKey)}
                    title={`Remove schedule record for ${w.label}`}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.muted,
                      cursor: "pointer",
                      padding: "6px",
                      borderRadius: RADIUS.xs,
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.danger)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.muted)}
                  >
                    <FaTrashAlt />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Sticky Action Bar if changes were made */}
      {isDirty && (
        <div
          style={{
            position: "sticky",
            bottom: "20px",
            marginTop: "32px",
            background: COLORS.secondary,
            color: "#FFFFFF",
            borderRadius: RADIUS.medium,
            padding: "16px 24px",
            boxShadow: SHADOWS.elevated,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            zIndex: 90
          }}
        >
          <div>
            <strong style={{ fontSize: "14px", display: "block" }}>
              You have unsaved changes in your availability schedule.
            </strong>
            <span style={{ fontSize: "12px", color: "#A0A4B8" }}>
              Remember to save your changes so customers can book during these hours.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                fetchAvailability();
                setIsDirty(false);
              }}
              style={{ color: "#FFFFFF", borderColor: "#4A4D68" }}
            >
              Reset Changes
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              icon={<FaSave />}
              onClick={handleSaveAll}
              loading={isSavingAll}
              disabled={isSavingAll}
            >
              {isSavingAll ? "Saving..." : "Save All Schedule"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Availability;
