import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaStar,
  FaArrowRight,
  FaStore,
  FaCrown,
  FaCheckCircle
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  TRANSITIONS
} from "./designSystem";

function BusinessCard({ business, style = {} }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  if (!business) return null;

  const {
    _id,
    name,
    category,
    address,
    city,
    contactNumber,
    openingHours,
    rating = 0
  } = business;

  // Strict Rule 1: Display ratings ONLY if actual rating data exists (> 0)
  const hasActualRating = typeof rating === "number" && rating > 0;

  function handleCardClick() {
    navigate(`/business/${_id}`);
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick();
        }
      }}
      style={{
        background: COLORS.surface,
        border: `1px solid ${isHovered ? COLORS.borderFocus : COLORS.border}`,
        borderRadius: RADIUS.medium,
        boxShadow: isHovered ? SHADOWS.hover : SHADOWS.card,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: `all ${TRANSITIONS.fast}`,
        transform: isHovered ? "translateY(-4px)" : "none",
        boxSizing: "border-box",
        outline: "none",
        position: "relative",
        ...style
      }}
    >
      <div>
        {/* Top Header: Category & Rating Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "14px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "4px 10px",
                background: COLORS.primaryBg,
                color: COLORS.primaryDark,
                borderRadius: RADIUS.xs,
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.04em",
                textTransform: "uppercase"
              }}
            >
              {category || "Local Business"}
            </span>

            {business.subscriptionTier === "PREMIUM" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                  color: "#B45309",
                  border: "1px solid #FCD34D",
                  borderRadius: RADIUS.pill,
                  fontSize: "10px",
                  fontWeight: "800",
                  letterSpacing: "0.5px"
                }}
                title="Premium Elite Merchant"
              >
                <FaCrown size={10} color="#D97706" />
                <span>PREMIUM</span>
              </span>
            )}

            {business.subscriptionTier === "PRO" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  background: "rgba(79, 70, 229, 0.1)",
                  color: COLORS.primary,
                  border: "1px solid rgba(79, 70, 229, 0.3)",
                  borderRadius: RADIUS.pill,
                  fontSize: "10px",
                  fontWeight: "800",
                  letterSpacing: "0.5px"
                }}
                title="Verified Pro Provider"
              >
                <FaCheckCircle size={10} color={COLORS.primary} />
                <span>PRO</span>
              </span>
            )}
          </div>

          {/* Rating Badge: strictly shows actual rating only if > 0 */}
          {hasActualRating ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: COLORS.warningBg,
                color: "#9A6200",
                border: `1px solid ${COLORS.warningBorder}`,
                padding: "3px 8px",
                borderRadius: RADIUS.pill,
                fontSize: "12px",
                fontWeight: "700"
              }}
            >
              <FaStar color={COLORS.warning} size={11} />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : (
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: COLORS.muted,
                background: COLORS.surfaceSubtle,
                padding: "3px 8px",
                borderRadius: RADIUS.pill,
                border: `1px solid ${COLORS.border}`
              }}
            >
              New Merchant
            </span>
          )}
        </div>

        {/* Business Name */}
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: COLORS.secondary,
            margin: "0 0 10px",
            lineHeight: "1.3"
          }}
        >
          {name}
        </h3>

        {/* Business Details Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "13px",
            color: COLORS.muted,
            marginBottom: "18px"
          }}
        >
          {/* Location */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <FaMapMarkerAlt
              color={COLORS.primary}
              size={13}
              style={{ marginTop: "3px", flexShrink: 0 }}
            />
            <span style={{ lineHeight: "1.4" }}>
              {address ? `${address}, ${city}` : city || "Location available on profile"}
            </span>
          </div>

          {/* Contact */}
          {contactNumber && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaPhoneAlt color={COLORS.muted} size={11} style={{ flexShrink: 0 }} />
              <span>{contactNumber}</span>
            </div>
          )}

          {/* Opening Hours if available */}
          {openingHours && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaClock color={COLORS.muted} size={12} style={{ flexShrink: 0 }} />
              <span>{openingHours}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          paddingTop: "16px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: COLORS.primary,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          View Services <FaArrowRight size={11} />
        </span>

        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: RADIUS.small,
            background: isHovered ? COLORS.primary : COLORS.surfaceSubtle,
            color: isHovered ? COLORS.white : COLORS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            transition: `all ${TRANSITIONS.fast}`
          }}
        >
          <FaStore />
        </div>
      </div>
    </div>
  );
}

export default BusinessCard;
