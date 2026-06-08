import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import Login from "./Login";
import Dashboard from "../pages/Dashboard";

export default function App() {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
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

  if (loading) return null;
  if (isSupabaseConfigured && !session && !bypass) {
    return <Login onBypass={() => setBypass(true)} />;
  }
  return <Dashboard session={session} />;
}