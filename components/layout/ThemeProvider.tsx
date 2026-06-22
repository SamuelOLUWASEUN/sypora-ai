"use client";
import { useEffect, useRef } from "react";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, hasHydrated } = useThemeStore();
  const firstRun = useRef(true);

  useEffect(() => {
    if (!hasHydrated) return;
    const html = document.documentElement;

    // On the very first applied change after hydration we don't need to
    // suppress transitions (nothing is visibly transitioning yet). On every
    // later toggle, kill transitions for one frame so the theme flips instantly
    // instead of animating hundreds of `transition-all` elements at once
    // (which caused the laggy color sweep).
    if (firstRun.current) {
      firstRun.current = false;
      html.classList.toggle("dark", theme === "dark");
      return;
    }

    html.classList.add("theme-switching");
    html.classList.toggle("dark", theme === "dark");
    // Force a reflow so the class change applies before we remove the guard,
    // then drop the guard on the next frame so normal transitions resume.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => html.classList.remove("theme-switching"));
    });
  }, [theme, hasHydrated]);

  return <>{children}</>;
}
