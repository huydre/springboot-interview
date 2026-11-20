import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/** Display name shown on comments: profile metadata, else the part of the email before @. */
export const displayName = (u: User) => ((u.user_metadata?.name as string | undefined)?.trim() || u.email?.split("@")[0] || "Bạn");

/** Current Supabase user. `enabled` is false when the build has no Supabase settings. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready, enabled: !!supabase };
}
