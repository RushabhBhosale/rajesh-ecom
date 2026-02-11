"use client";

import { useEffect } from "react";

export function PwaClient() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const swUrl = "/sw.js";

    const register = async () => {
      try {
        await navigator.serviceWorker.register(swUrl, { scope: "/" });
      } catch (error) {
        console.error("PWA: failed to register service worker", error);
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandaloneClass = () => {
      const isStandalone = mediaQuery.matches || (window.navigator as unknown as { standalone?: boolean }).standalone;
      document.documentElement.classList.toggle("is-standalone", Boolean(isStandalone));
    };

    updateStandaloneClass();
    mediaQuery.addEventListener("change", updateStandaloneClass);

    return () => {
      mediaQuery.removeEventListener("change", updateStandaloneClass);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
