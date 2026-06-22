"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, hasHydrated } = useThemeStore();

  useEffect(() => {
    // Don't touch the class until the persisted theme has actually loaded.
    // Before hydration the store holds its default ("light"), and applying
    // that would wipe the `dark` class the inline <head> script already set,
    // causing a dark -> light -> dark flash on load.
    if (!hasHydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hasHydrated]);

  return <>{children}</>;
}
