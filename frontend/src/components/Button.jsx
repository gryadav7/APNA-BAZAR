import { useState } from "react";
import { COLORS, RADIUS, TRANSITIONS } from "./designSystem";

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  icon = null,
  iconPosition = "left",
  style = {}
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Size specifications
  const sizeStyles = {
    sm: {
      padding: "8px 16px",
      fontSize: "13px",
      borderRadius: RADIUS.small,
      gap: "6px"
    },
    md: {
      padding: "12px 22px",
      fontSize: "14px",
      borderRadius: RADIUS.small,
      gap: "8px"
    },
    lg: {
      padding: "15px 28px",
      fontSize: "16px",
      borderRadius: RADIUS.medium,
      gap: "10px"
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // Variant base, hover and active color mapping
  const variantStyles = {
    primary: {
      background: isActive
        ? COLORS.primaryDark
        : isHovered
        ? COLORS.primaryDark
        : COLORS.primary,
      color: COLORS.white,
      border: "none",
      boxShadow: isHovered ? "0 6px 18px rgba(98, 88, 232, 0.35)" : "none"
    },
    secondary: {
      background: isActive
        ? COLORS.secondaryDark
        : isHovered
        ? COLORS.secondaryLight
        : COLORS.secondary,
      color: COLORS.white,
      border: "none",
      boxShadow: isHovered ? "0 6px 18px rgba(23, 26, 47, 0.25)" : "none"
    },
    outline: {
      background: isHovered ? COLORS.surfaceHover : "transparent",
      color: isHovered ? COLORS.primary : COLORS.text,
      border: `1px solid ${isHovered ? COLORS.primary : COLORS.border}`,
      boxShadow: "none"
    },
    ghost: {
      background: isHovered ? COLORS.primaryBg : "transparent",
      color: isHovered ? COLORS.primary : COLORS.textSecondary,
      border: "none",
      boxShadow: "none"
    },
    danger: {
      background: isActive
        ? "#C93B40"
        : isHovered
        ? "#D63F44"
        : COLORS.danger,
      color: COLORS.white,
      border: "none",
      boxShadow: isHovered ? "0 6px 18px rgba(229, 72, 77, 0.35)" : "none"
    },
    success: {
      background: isActive
        ? "#128757"
        : isHovered
        ? "#14935F"
        : COLORS.success,
      color: COLORS.white,
      border: "none",
      boxShadow: isHovered ? "0 6px 18px rgba(22, 163, 106, 0.35)" : "none"
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: fullWidth ? "100%" : "auto",
    fontFamily: "inherit",
    fontWeight: "600",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    outline: "none",
    transition: `all ${TRANSITIONS.fast}`,
    transform: isActive && !disabled && !loading ? "scale(0.98)" : "none",
    boxSizing: "border-box",
    textDecoration: "none",
    userSelect: "none",
    ...currentSize,
    ...currentVariant,
    ...style
  };

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      style={baseStyle}
    >
      {loading ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 50 50"
            style={{ display: "inline-block" }}
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeDasharray="90 150"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 25 25"
                to="360 25 25"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span style={{ display: "inline-flex", fontSize: "1.1em" }}>
              {icon}
            </span>
          )}
          <span>{children}</span>
          {icon && iconPosition === "right" && (
            <span style={{ display: "inline-flex", fontSize: "1.1em" }}>
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export default Button;
