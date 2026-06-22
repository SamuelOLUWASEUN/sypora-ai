"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/supabase/client";

type AuthContextValue = {
  user: any;
  /** True once the initial getUser() call has resolved — use this to avoid
   *  rendering a signed-out state before we actually know the real state. */
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, ready: false });

/**
 * Fetches the Supabase auth user ONCE per page load and shares it via
 * context. Previously every component that needed auth state (Navbar, Hero,
 * CTA, Pricing) ran its own independent supabase.auth.getUser() call and its
 * own onAuthStateChange listener — up to 4 redundant subscriptions on a
 * single page. This consolidates it to one.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
