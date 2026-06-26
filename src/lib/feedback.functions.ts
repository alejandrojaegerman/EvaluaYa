import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  page: z.string().trim().max(300).optional().default(""),
  language: z.enum(["es", "en"]).optional().default("es"),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => feedbackSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        {
          auth: {
            storage: undefined,
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const { error } = await supabase.from("feedback").insert({
        message: data.message,
        email: data.email ?? null,
        page: data.page || null,
        language: data.language,
      });

      if (error) {
        console.error("[feedback] insert", error);
        return { ok: false };
      }

      // Notify the site owner (best-effort — never blocks the submission).
      try {
        const { sendSystemEmail } = await import("./notify-email.server");
        await sendSystemEmail({
          templateName: "feedback-notification",
          templateData: {
            message: data.message,
            email: data.email ?? "",
            page: data.page || "—",
            language: data.language,
          },
        });
      } catch (notifyErr) {
        console.error("[feedback] notification failed", notifyErr);
      }

      return { ok: true };
    } catch (err) {
      console.error("[feedback] submitFeedback", err);
      return { ok: false };
    }
  });
