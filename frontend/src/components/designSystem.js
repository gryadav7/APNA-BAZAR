// APNA-BAZAR Design System
// Master theme constants for inline CSS styling across the application

export const COLORS = {
  primary: "#6258E8",
  primaryDark: "#4840C7",
  primaryLight: "#8B82FF",
  primaryBg: "#F0EFFF",

  secondary: "#171A2F",
  secondaryDark: "#0F1123",
  secondaryLight: "#2E3253",

  background: "#F8F8FC",
  surface: "#FFFFFF",
  surfaceHover: "#F5F5FA",
  surfaceSubtle: "#FBFBFE",

  text: "#202238",
  textSecondary: "#4A4D68",
  muted: "#777B91",
  mutedLight: "#A0A4B8",

  border: "#ECECF3",
  borderFocus: "#B8B3F5",
  borderDark: "#D2D2E0",

  success: "#16A36A",
  successBg: "#E8F8F0",
  successBorder: "#A3E6C5",

  danger: "#E5484D",
  dangerBg: "#FDE8E9",
  dangerBorder: "#F9B8BA",

  warning: "#F5A623",
  warningBg: "#FEF6E9",
  warningBorder: "#FCD79B",

  info: "#3B82F6",
  infoBg: "#EFF6FF",
  infoBorder: "#BFDBFE",

  lightPurple: "#F0EFFF",
  lightBlue: "#EEF5FF",
  white: "#FFFFFF",
  black: "#000000"
};

export const SHADOWS = {
  sm: "0 2px 8px rgba(30, 30, 70, 0.04)",
  card: "0 8px 30px rgba(30, 30, 70, 0.06)",
  hover: "0 14px 38px rgba(30, 30, 70, 0.10)",
  elevated: "0 18px 50px rgba(30, 30, 70, 0.12)",
  modal: "0 24px 60px rgba(15, 17, 35, 0.18)"
};

export const RADIUS = {
  xs: "6px",
  small: "10px",
  medium: "16px",
  large: "24px",
  pill: "100px",
  round: "50%"
};

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  section: "72px"
};

export const TYPOGRAPHY = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  h1: {
    fontSize: "clamp(30px, 4.5vw, 54px)",
    fontWeight: "800",
    lineHeight: 1.18,
    letterSpacing: "-0.02em"
  },
  h2: {
    fontSize: "clamp(24px, 3.2vw, 36px)",
    fontWeight: "700",
    lineHeight: 1.25,
    letterSpacing: "-0.015em"
  },
  h3: {
    fontSize: "clamp(18px, 2.2vw, 24px)",
    fontWeight: "700",
    lineHeight: 1.35
  },
  h4: {
    fontSize: "17px",
    fontWeight: "600",
    lineHeight: 1.4
  },
  body: {
    fontSize: "15px",
    lineHeight: 1.6
  },
  bodySmall: {
    fontSize: "13px",
    lineHeight: 1.5
  },
  caption: {
    fontSize: "12px",
    lineHeight: 1.4
  }
};

export const TRANSITIONS = {
  fast: "0.15s ease",
  normal: "0.25s ease",
  smooth: "0.35s cubic-bezier(0.4, 0, 0.2, 1)"
};

export const PAGE_WIDTH = "1200px";

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 960,
  desktop: 1200
};
