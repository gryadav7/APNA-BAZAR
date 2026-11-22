import { useState, useEffect } from "react";
import { BREAKPOINTS } from "../components/designSystem";

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width: windowWidth,
    isMobile: windowWidth <= BREAKPOINTS.mobile,
    isTablet: windowWidth > BREAKPOINTS.mobile && windowWidth <= BREAKPOINTS.tablet,
    isDesktop: windowWidth > BREAKPOINTS.tablet
  };
}

export default useResponsive;
