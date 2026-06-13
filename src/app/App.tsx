import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import Login, { getAdminSession, clearAdminSession, type AdminSession } from "./Login";
import Dashboard from "../pages/Dashboard";

export default function App() {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    // Check for persisted admin session first
    const savedAdmin = getAdminSession();
    if (savedAdmin) {
      setAdminSession(savedAdmin);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  function handleAdminLogin(session: AdminSession) {
    setAdminSession(session);
  }

  function handleAdminLogout() {
    clearAdminSession();
    setAdminSession(null);
  }

  if (loading) return null;

  // Admin session active
  if (adminSession) {
    return (
      <Dashboard
        session={null}
        adminSession={adminSession}
        onAdminLogout={handleAdminLogout}
      />
    );
  }

  // Regular user flow
  if (isSupabaseConfigured && !session && !bypass) {
    return (
      <Login
        onBypass={() => setBypass(true)}
        onAdminLogin={handleAdminLogin}
      />
    );
  }

  return <Dashboard session={session} />;
}