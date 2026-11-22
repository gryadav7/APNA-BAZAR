import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { COLORS, RADIUS, TRANSITIONS } from "./designSystem";

function InputField({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder = "",
  error = "",
  required = false,
  disabled = false,
  icon = null,
  autoComplete = "off",
  style = {},
  inputStyle = {},
  helperText = ""
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id || name;
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  const hasError = Boolean(error);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "18px",
        width: "100%",
        boxSizing: "border-box",
        ...style
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: hasError ? COLORS.danger : COLORS.secondary,
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span>
            {label} {required && <span style={{ color: COLORS.danger }}>*</span>}
          </span>
        </label>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: disabled ? COLORS.surfaceSubtle : COLORS.surface,
          border: `1px solid ${
            hasError
              ? COLORS.danger
              : isFocused
              ? COLORS.primary
              : COLORS.border
          }`,
          borderRadius: RADIUS.small,
          boxShadow: isFocused
            ? hasError
              ? "0 0 0 3px rgba(229, 72, 77, 0.15)"
              : "0 0 0 3px rgba(98, 88, 232, 0.15)"
            : "none",
          transition: `all ${TRANSITIONS.fast}`,
          boxSizing: "border-box"
        }}
      >
        {/* Left Icon */}
        {icon && (
          <span
            style={{
              paddingLeft: "14px",
              display: "flex",
              alignItems: "center",
              color: hasError ? COLORS.danger : isFocused ? COLORS.primary : COLORS.muted,
              fontSize: "15px"
            }}
          >
            {icon}
          </span>
        )}

        {/* Input Element */}
        <input
          id={inputId}
          name={name}
          type={actualType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          style={{
            width: "100%",
            padding: "13px 14px",
            paddingLeft: icon ? "10px" : "14px",
            paddingRight: isPassword ? "44px" : "14px",
            fontSize: "14px",
            color: COLORS.text,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            borderRadius: RADIUS.small,
            ...inputStyle
          }}
        />

        {/* Password Toggle Button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "12px",
              background: "transparent",
              border: "none",
              color: COLORS.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
              borderRadius: RADIUS.xs,
              fontSize: "15px"
            }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>

      {/* Field Error Message */}
      {hasError && (
        <span
          style={{
            color: COLORS.danger,
            fontSize: "12px",
            fontWeight: "500",
            marginTop: "5px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          {error}
        </span>
      )}

      {/* Helper Text */}
      {!hasError && helperText && (
        <span
          style={{
            color: COLORS.muted,
            fontSize: "12px",
            marginTop: "4px"
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}

export default InputField;
