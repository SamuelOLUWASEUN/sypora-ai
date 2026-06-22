import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider }  from "@/components/layout/AuthProvider";
import { Toaster }       from "sonner";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcf8" },
    { media: "(prefers-color-scheme: dark)",  color: "#090f28" },
  ],
  width:        "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title:       { default: "Sypora AI — Your Team's AI Workspace Hub", template: "%s | Sypora AI" },
  description: "Connect your tools. Ask anything. Get instant answers, automated summaries, and AI-powered insights.",
  manifest:    "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Sypora AI" },
  icons: {
    icon:  [{ url: "/icons/icon-96.png", sizes: "96x96",   type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Runs before the browser paints, so the correct theme is applied on the
  // very first frame — no flash of the wrong theme on load. Reads the same
  // Zustand-persisted key ("nexus-theme") that the theme store writes to.
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem("nexus-theme");
        var theme = stored ? JSON.parse(stored).state.theme : "light";
        if (theme === "dark") document.documentElement.classList.add("dark");
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{ style: { fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: "14px" } }}
        />
      </body>
    </html>
  );
}