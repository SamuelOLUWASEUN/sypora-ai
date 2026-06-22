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

// NOTE: This store only manages STATE. It never touches the DOM class.
// ThemeProvider is the single source of truth for applying the `dark` class,
// which avoids two code paths writing the class at once (the cause of the
// flash when toggling).
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      hasHydrated: false,
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setTheme: (theme) => set({ theme }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "nexus-theme",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
