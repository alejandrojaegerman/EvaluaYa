import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Cancelar suscripción — EvalúaYa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

type State =
  | "loading"
  | "valid"
  | "invalid"
  | "already"
  | "submitting"
  | "done"
  | "error";

function UnsubscribePage() {
  const [state, setState] = useState<State>("loading");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (!t) {
      setState("invalid");
      return;
    }
    setToken(t);
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setState("valid");
        else if (d.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, []);

  async function confirm() {
    if (!token) return;
    setState("submitting");
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.success) setState("done");
      else if (d.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="font-display text-lg font-bold">Cancelar suscripción</h1>

        {state === "loading" && (
          <p className="mt-3 text-sm text-muted-foreground">Verificando…</p>
        )}

        {state === "valid" && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Confirma para dejar de recibir correos de EvalúaYa en esta
              dirección.
            </p>
            <Button className="mt-5 w-full" onClick={confirm}>
              Confirmar cancelación
            </Button>
          </>
        )}

        {state === "submitting" && (
          <p className="mt-3 text-sm text-muted-foreground">Procesando…</p>
        )}

        {state === "done" && (
          <p className="mt-3 text-sm text-risk-green">
            Listo. No recibirás más correos en esta dirección.
          </p>
        )}

        {state === "already" && (
          <p className="mt-3 text-sm text-muted-foreground">
            Esta dirección ya estaba dada de baja.
          </p>
        )}

        {state === "invalid" && (
          <p className="mt-3 text-sm text-muted-foreground">
            El enlace no es válido o ya expiró.
          </p>
        )}

        {state === "error" && (
          <p className="mt-3 text-sm text-risk-red">
            Ocurrió un error. Inténtalo de nuevo más tarde.
          </p>
        )}
      </div>
    </AppShell>
  );
}
