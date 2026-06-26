import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Admin server functions for the X (Twitter) review queue. Gated by
// VOLUNTEER_ADMIN_SECRET (same secret as the other admin pages). All access is
// through the service-role client; the social_posts table has no public access.
// ---------------------------------------------------------------------------

export type SocialPost = {
  id: string;
  kind: "milestone" | "insight" | "product_update";
  body: string;
  status: "draft" | "approved" | "rejected" | "posted" | "failed";
  xPostId: string | null;
  errorMessage: string | null;
  createdAt: string;
  postedAt: string | null;
};

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

type DB = {
  from: (table: string) => any;
};

async function getDb(): Promise<DB> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as DB;
}

function mapRow(r: any): SocialPost {
  return {
    id: r.id,
    kind: r.kind,
    body: r.body,
    status: r.status,
    xPostId: r.x_post_id ?? null,
    errorMessage: r.error_message ?? null,
    createdAt: r.created_at,
    postedAt: r.posted_at ?? null,
  };
}

const secretOnly = z.object({ adminSecret: z.string().min(1).max(256) });

/** List all posts, newest first, plus whether X credentials are configured. */
export const adminListSocial = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => secretOnly.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; posts: SocialPost[]; xConfigured: boolean }> => {
      if (!adminOk(data.adminSecret))
        return { ok: false, posts: [], xConfigured: false };
      try {
        const { xCredentialsConfigured } = await import("./x-post.server");
        const db = await getDb();
        const { data: rows, error } = await db
          .from("social_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) {
          console.error("[social] adminListSocial", error);
          return { ok: true, posts: [], xConfigured: xCredentialsConfigured() };
        }
        return {
          ok: true,
          posts: (rows ?? []).map(mapRow),
          xConfigured: xCredentialsConfigured(),
        };
      } catch (e) {
        console.error("[social] adminListSocial failed", e);
        return { ok: false, posts: [], xConfigured: false };
      }
    },
  );

const createSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  body: z.string().trim().min(1).max(280),
});

/** Compose a product-update draft by hand. Enters the same approve→post flow. */
export const adminCreateProductUpdate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!adminOk(data.adminSecret)) return { ok: false };
    try {
      const db = await getDb();
      const { error } = await db.from("social_posts").insert({
        kind: "product_update",
        body: data.body,
        status: "draft",
      });
      if (error) {
        console.error("[social] adminCreateProductUpdate", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[social] adminCreateProductUpdate failed", e);
      return { ok: false };
    }
  });

const editSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(280),
});

/** Edit the text of a post that has not been published yet. */
export const adminUpdatePostBody = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => editSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!adminOk(data.adminSecret)) return { ok: false };
    try {
      const db = await getDb();
      const { error } = await db
        .from("social_posts")
        .update({ body: data.body })
        .eq("id", data.id)
        .in("status", ["draft", "approved", "rejected", "failed"]);
      if (error) {
        console.error("[social] adminUpdatePostBody", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[social] adminUpdatePostBody failed", e);
      return { ok: false };
    }
  });

const reviewSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "retry"]),
});

/** Approve, reject, or re-queue (retry) a post. */
export const adminReviewPost = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!adminOk(data.adminSecret)) return { ok: false };
    try {
      const db = await getDb();
      const patch: Record<string, unknown> =
        data.action === "approve"
          ? { status: "approved", approved_at: new Date().toISOString(), error_message: null }
          : data.action === "retry"
            ? { status: "approved", error_message: null }
            : { status: "rejected" };
      const { error } = await db
        .from("social_posts")
        .update(patch)
        .eq("id", data.id)
        .neq("status", "posted");
      if (error) {
        console.error("[social] adminReviewPost", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[social] adminReviewPost failed", e);
      return { ok: false };
    }
  });

/** Manually trigger draft generation (same logic as the daily cron). */
export const adminGenerateNow = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => secretOnly.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; created: number }> => {
    if (!adminOk(data.adminSecret)) return { ok: false, created: 0 };
    try {
      const { generateSocialDrafts } = await import("./social-generate.server");
      const res = await generateSocialDrafts();
      return { ok: res.ok, created: res.created };
    } catch (e) {
      console.error("[social] adminGenerateNow failed", e);
      return { ok: false, created: 0 };
    }
  });
