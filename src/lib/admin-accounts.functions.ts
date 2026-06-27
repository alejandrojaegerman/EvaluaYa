import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Admin: lightweight visibility into the optional "Save my reports" accounts.
// Gated by VOLUNTEER_ADMIN_SECRET (same secret as the rest of the admin panel).
// Reads go through the service-role client only.
// ---------------------------------------------------------------------------

export type AccountRow = {
  email: string;
  createdAt: string; // ISO
  lastSignInAt: string | null; // ISO
  reportCount: number;
};

export type AdminAccounts = {
  totalAccounts: number;
  withReports: number;
  withoutReports: number;
  recent: AccountRow[];
};

const EMPTY: AdminAccounts = {
  totalAccounts: 0,
  withReports: 0,
  withoutReports: 0,
  recent: [],
};

const adminSchema = z.object({
  adminSecret: z.string().min(1).max(256),
});

/** Constant-time compare against VOLUNTEER_ADMIN_SECRET. */
function adminOk(provided: string): boolean {
  const expected = process.env.VOLUNTEER_ADMIN_SECRET;
  if (!expected) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export const adminGetAccounts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ ok: boolean; accounts: AdminAccounts }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, accounts: EMPTY };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // 1) All accounts (paginated).
        type U = {
          id: string;
          email?: string | null;
          created_at?: string;
          last_sign_in_at?: string | null;
        };
        const users: U[] = [];
        const perPage = 1000;
        for (let page = 1; page <= 20; page++) {
          const { data: list, error } = await supabaseAdmin.auth.admin.listUsers(
            { page, perPage },
          );
          if (error || !list) break;
          for (const u of list.users) {
            users.push({
              id: u.id,
              email: u.email,
              created_at: u.created_at,
              last_sign_in_at: u.last_sign_in_at,
            });
          }
          if (list.users.length < perPage) break;
        }

        // 2) Reports linked to an account, counted per user.
        const { data: rows } = await supabaseAdmin
          .from("assessments")
          .select("user_id")
          .not("user_id", "is", null);
        const counts = new Map<string, number>();
        for (const r of rows ?? []) {
          const uid = (r as { user_id: string | null }).user_id;
          if (uid) counts.set(uid, (counts.get(uid) ?? 0) + 1);
        }

        const withReports = users.filter(
          (u) => (counts.get(u.id) ?? 0) > 0,
        ).length;

        const recent: AccountRow[] = users
          .slice()
          .sort((a, b) =>
            (b.created_at ?? "").localeCompare(a.created_at ?? ""),
          )
          .slice(0, 25)
          .map((u) => ({
            email: u.email ?? "—",
            createdAt: u.created_at ?? "",
            lastSignInAt: u.last_sign_in_at ?? null,
            reportCount: counts.get(u.id) ?? 0,
          }));

        return {
          ok: true,
          accounts: {
            totalAccounts: users.length,
            withReports,
            withoutReports: users.length - withReports,
            recent,
          },
        };
      } catch {
        return { ok: false, accounts: EMPTY };
      }
    },
  );
