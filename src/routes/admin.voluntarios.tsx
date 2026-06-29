import { createFileRoute, redirect } from "@tanstack/react-router";

// The volunteer-admin surface is now unified under /admin (Voluntarios &
// Seguimiento tabs). Keep this path working by redirecting any old links.
export const Route = createFileRoute("/admin/voluntarios")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
