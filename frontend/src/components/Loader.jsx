import { COLORS } from "./designSystem";

function Loader({
  size = 36,
  color = COLORS.primary,
  text = "",
  fullPage = false,
  style = {}
}) {
  const spinner = (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        ...style
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{ display: "block" }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={COLORS.border}
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="90 150"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="0.85s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      {text && (
        <span
          style={{
            fontSize: "14px",
            color: COLORS.muted,
            fontWeight: "500",
            textAlign: "center"
          }}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(248, 248, 252, 0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default Loader;
