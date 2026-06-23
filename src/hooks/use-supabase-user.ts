"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useSupabaseUser() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setLoading(true);
      setError(null);

      const { data, error: getUserError } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (getUserError) {
        setError(getUserError.message);
        setUser(null);
      } else {
        setUser(data.user);
      }

      setLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    loading,
    error,
    supabase,
  };
}
