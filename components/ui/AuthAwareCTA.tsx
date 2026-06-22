"use client";
import Link from "next/link";
import { type ReactNode } from "react";
import { useAuth } from "@/components/layout/AuthProvider";

/**
 * Renders a CTA link that points to /signup (or signupHref) for signed-out
 * visitors, and to /dashboard for signed-in users — so "Get started free"
 * never shows to someone who already has an account.
 */
export function AuthAwareCTA({
  signupHref = "/signup",
  className,
  children,
  signedInChildren,
}: {
  signupHref?: string;
  className?: string;
  children: ReactNode;
  /** What to render inside the link when the user is signed in. Defaults to children. */
  signedInChildren?: ReactNode;
}) {
  const { user, ready } = useAuth();

  // Avoid a flash of the wrong destination before auth state resolves
  if (!ready) {
    return (
      <Link href={signupHref} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link href={user ? "/dashboard" : signupHref} className={className}>
      {user ? (signedInChildren ?? children) : children}
    </Link>
  );
}
