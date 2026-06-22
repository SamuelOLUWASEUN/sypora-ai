"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";
import { useAuth } from "@/components/layout/AuthProvider";
import { cn } from "@/lib/utils";

function NavbarAuth() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="btn-ghost text-sm hidden md:flex">
          Dashboard
        </Link>
        <Link href="/dashboard"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-indigo flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/login" className="hidden md:flex btn-ghost text-sm whitespace-nowrap">Sign in</Link>
      <Link href="/signup" className="btn-primary text-sm px-3 py-2 md:px-5 md:py-2.5 whitespace-nowrap">
        Get started free
      </Link>
    </>
  );
}

function MobileMenuAuth({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

  if (user) {
    return (
      <Link href="/dashboard" className="btn-primary w-full text-center" onClick={onClose}>
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="btn-secondary w-full text-center" onClick={onClose}>
        Sign in
      </Link>
      <Link href="/signup" className="btn-primary w-full text-center" onClick={onClose}>
        Get started free
      </Link>
    </>
  );
}

// Simplified nav — only the pages users actually need
const navLinks = [
  {
    label: "Product",
    children: [
      { href: "/features",     label: "Features",     desc: "Everything Sypora can do"     },
      { href: "/integrations", label: "Integrations", desc: "100+ tool connections"        },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog",    href: "/blog"    },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, hasHydrated } = useThemeStore();
  const [scrolled, setScrolled]           = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(72);

  useEffect(() => {
    if (navRef.current) {
      setHeaderHeight(navRef.current.offsetHeight);
    }
  }, [scrolled, mobileOpen]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 16);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll while mobile menu is open.
  // overflow:hidden alone is unreliable on mobile Safari/Chrome — the page can
  // still be dragged via touch. Pinning the body with position:fixed blocks
  // that, and we restore the exact scroll position on close.
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const original = {
      position: body.style.position,
      top:      body.style.top,
      left:     body.style.left,
      right:    body.style.right,
      width:    body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top      = `-${scrollY}px`;
    body.style.left     = "0";
    body.style.right    = "0";
    body.style.width    = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = original.position;
      body.style.top      = original.top;
      body.style.left     = original.left;
      body.style.right    = original.right;
      body.style.width    = original.width;
      body.style.overflow = original.overflow;
      // The site uses `scroll-behavior: smooth` globally, which would animate
      // this restore and make the page appear to scroll itself back. Force an
      // instant jump by suspending smooth scrolling just for this restore.
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollY);
      html.style.scrollBehavior = prevBehavior;
    };
  }, [mobileOpen]);

  // Close mobile menu on outside tap/click.
  // We defer attaching the listener by a tick so the very tap that OPENED the
  // menu can't be caught by this handler and immediately close it again.
  useEffect(() => {
    if (!mobileOpen) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Don't render navbar on dashboard
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <header ref={navRef} style={{ "--header-h": `${headerHeight}px` } as React.CSSProperties} className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      mobileOpen
        ? "bg-white dark:bg-navy-950 border-b border-navy-100 dark:border-navy-800 py-3 shadow-sm"
        : scrolled
        ? "bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-navy-100 dark:border-navy-800 py-3 shadow-sm"
        : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-accent-blue flex items-center justify-center shadow-navy group-hover:shadow-blue transition-all duration-200 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 2V16M2.5 6L15.5 12M15.5 6L2.5 12" stroke="white" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-display font-semibold text-xl text-navy-900 dark:text-cream-50 tracking-tight whitespace-nowrap">
            Sypora <span className="text-accent-blue">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            link.children ? (
              <div key={link.label} className="relative"
                onMouseEnter={() => setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}>
                <button className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-150",
                  "text-navy-600 dark:text-cream-300 hover:text-navy-900 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800"
                )}>
                  {link.label}
                  <ChevronDown size={14} className={cn("transition-transform", activeDropdown === link.label && "rotate-180")} />
                </button>
                {activeDropdown === link.label && (
                  <div className="absolute top-full left-0 pt-2 w-64 animate-fade-up">
                    <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl shadow-card-hover overflow-hidden p-2">
                      {link.children.map(child => (
                        <Link key={child.href} href={child.href}
                          className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors group">
                          <span className="font-body font-semibold text-sm text-navy-900 dark:text-cream-100 group-hover:text-accent-blue transition-colors">
                            {child.label}
                          </span>
                          <span className="font-body text-xs text-navy-400 dark:text-cream-400">{child.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={link.href} href={link.href!} className={cn(
                "px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-150",
                pathname === link.href
                  ? "bg-navy-50 dark:bg-navy-800 text-navy-900 dark:text-white"
                  : "text-navy-600 dark:text-cream-300 hover:text-navy-900 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800"
              )}>
                {link.label}
              </Link>
            )
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-navy-500 dark:text-cream-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-all"
            title={hasHydrated && theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {hasHydrated && theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Auth buttons */}
          <NavbarAuth />

          {/* Mobile hamburger — only ONE, only on marketing pages */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-navy-600 dark:text-cream-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition-all"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — a semi-transparent dim covers the page (you can still
          faintly see content behind it, and tapping it closes the menu), with a
          solid link panel sitting at the top so the links stay readable.
          The header must NOT use backdrop-filter while open, or this fixed
          overlay would be contained by the header instead of the viewport. */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40"
          style={{ top: "var(--header-h)" }}
        >
          {/* See-through dim + blur — tap anywhere on it to close */}
          <div
            className="absolute inset-0 bg-navy-950/30 dark:bg-navy-950/50 backdrop-blur-md animate-fade-in"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />

          {/* Solid link panel on top of the dim */}
          <div className="relative bg-white dark:bg-navy-950 border-t border-navy-100 dark:border-navy-800 px-4 py-4 space-y-1 shadow-lg animate-fade-in">
            {navLinks.map((link) => (
              link.children ? (
                <div key={link.label}>
                  <p className="px-3 py-1.5 text-xs font-mono font-medium text-navy-400 dark:text-cream-500 uppercase tracking-wider">
                    {link.label}
                  </p>
                  {link.children.map(child => (
                    <Link key={child.href} href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 rounded-xl text-sm font-body text-navy-700 dark:text-cream-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors">
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link key={link.href} href={link.href!}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-body text-navy-700 dark:text-cream-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors">
                  {link.label}
                </Link>
              )
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <MobileMenuAuth onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}