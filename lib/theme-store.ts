"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeStore = {
  theme: "light" | "dark";
  hasHydrated: boolean;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setHasHydrated: (state: boolean) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      hasHydrated: false,
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        set({ theme: next });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", next === "dark");
        }
      },
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "nexus-theme",
      // Only apply the persisted value to the DOM once Zustand has actually
      // rehydrated client-side — prevents a mismatch with the server-rendered
      // HTML (which always starts from the "light" default).
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", state.theme === "dark");
          }
        }
      },
    }
  )
);
