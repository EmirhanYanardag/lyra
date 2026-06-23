"use client";

import { useEffect, useState } from "react";

export function LandingPreloadOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    const removeTimer = window.setTimeout(() => {
      setIsMounted(false);
    }, 1650);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[2000] bg-[#050507] transition-opacity duration-700 ease-out ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
  );
}
