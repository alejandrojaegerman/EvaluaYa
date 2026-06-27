import { useEffect, useRef } from "react";

import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { claimAssessments } from "@/lib/account.functions";
import { getDeviceId } from "@/lib/device-id";
import { getHistory } from "@/lib/history";
import { useLang } from "@/lib/i18n";

/**
 * App-wide auto-claim. Whenever a session is present (initial load or a fresh
 * sign-in from the email link, on ANY route), link every still-unclaimed
 * report from this device — plus any publicIds known locally — to the account.
 *
 * This is the fix for reports never attaching: claiming used to run only on
 * `/mis-reportes`, so users who landed anywhere else after clicking the email
 * link kept an empty account. Claiming is idempotent (only fills NULL user_id),
 * so running it on every sign-in is safe.
 */
export function useClaimOnSignIn(): void {
  const claim = useServerFn(claimAssessments);
  const { t } = useLang();
  const doneRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function run() {
      if (doneRef.current) return;
      doneRef.current = true;
      try {
        const params = new URLSearchParams(window.location.search);
        const deviceId = params.get("d") || getDeviceId();
        const publicIds = getHistory().map((h) => h.publicId);
        const res = await claim({ data: { deviceId, publicIds } });
        if (active && res && res.claimed > 0) {
          toast.success(t("account.claimToast"));
        }
      } catch {
        /* non-fatal — claiming retries on the next sign-in event */
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void run();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        doneRef.current = false;
        return;
      }
      if (
        session &&
        (event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "USER_UPDATED")
      ) {
        void run();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [claim, t]);
}
