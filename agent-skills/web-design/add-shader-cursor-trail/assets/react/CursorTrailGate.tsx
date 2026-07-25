"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

const CursorTrailShader = lazy(() => import("./CursorTrailShader"));

export default function CursorTrailGate() {
  const mountRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reducedTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const region = mountRef.current?.parentElement;
    const rect = region?.getBoundingClientRect();
    let regionIsVisible = rect
      ? rect.bottom >= -120 && rect.top <= window.innerHeight + 120
      : true;
    let windowIsFocused = document.hasFocus();

    const updateAvailability = () => {
      const webGpuAvailable = Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
      setEnabled(
        webGpuAvailable &&
          finePointer.matches &&
          !reducedMotion.matches &&
          !reducedTransparency.matches &&
          regionIsVisible &&
          windowIsFocused &&
          document.visibilityState === "visible",
      );
    };

    const onWindowBlur = () => {
      windowIsFocused = false;
      updateAvailability();
    };
    const onWindowFocus = () => {
      windowIsFocused = true;
      updateAvailability();
    };

    const visibilityObserver =
      "IntersectionObserver" in window && region
        ? new IntersectionObserver(
            ([entry]) => {
              regionIsVisible = entry?.isIntersecting ?? false;
              updateAvailability();
            },
            { rootMargin: "120px 0px" },
          )
        : null;

    updateAvailability();
    reducedMotion.addEventListener("change", updateAvailability);
    reducedTransparency.addEventListener("change", updateAvailability);
    finePointer.addEventListener("change", updateAvailability);
    document.addEventListener("visibilitychange", updateAvailability);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    if (region) visibilityObserver?.observe(region);

    return () => {
      reducedMotion.removeEventListener("change", updateAvailability);
      reducedTransparency.removeEventListener("change", updateAvailability);
      finePointer.removeEventListener("change", updateAvailability);
      document.removeEventListener("visibilitychange", updateAvailability);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      visibilityObserver?.disconnect();
    };
  }, []);

  return (
    <span className="cursor-trail-mount" ref={mountRef}>
      {enabled ? (
        <Suspense fallback={null}>
          <CursorTrailShader />
        </Suspense>
      ) : null}
    </span>
  );
}
