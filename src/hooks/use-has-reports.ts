import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getHistory } from "@/lib/history";

/**
 * Client-only signal for whether the current visitor has any reports worth
 * surfacing in navigation. True when EITHER this device has at least one entry
 * in local history, OR there is an active account session.
 *
 * Starts `false` on the server and first paint to avoid SSR hydration
 * mismatches, then resolves on mount and updates live on sign-in/sign-out.
 */
export function useHasReports(): boolean {
  const [hasReports, setHasReports] = useState(false);

  useEffect(() => {
    let active = true;

    const localHasReports = () => {
      try {
        return getHistory().length > 0;
      } catch {
        return false;
      }
    };

    // Local history is enough on its own.
    if (localHasReports()) {
      setHasReports(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setHasReports(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setHasReports(!!session || localHasReports());
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return hasReports;
}
