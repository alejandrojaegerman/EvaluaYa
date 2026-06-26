import * as React from "react";
import { render } from "react-email";
import { createClient } from "@supabase/supabase-js";

import { TEMPLATES } from "./email-templates/registry";

// Server-only helper to send a registered transactional email WITHOUT a
// Supabase user JWT. Use this for internal/system notifications triggered by
// public (unauthenticated) actions — e.g. notifying the site owner that a new
// volunteer signed up. Mirrors the protections of the /lovable/email send
// route (suppression check, unsubscribe token) using the service-role client.

const SITE_NAME = "EvalúaYa";
const SENDER_DOMAIN = "notify.evaluaya.app";
const FROM_DOMAIN = "evaluaya.app";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sendSystemEmail(params: {
  templateName: string;
  /** Optional — ignored when the template defines a fixed `to`. */
  recipientEmail?: string;
  templateData?: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[notify-email] missing supabase env");
    return { ok: false, reason: "config" };
  }

  const template = TEMPLATES[params.templateName];
  if (!template) {
    console.error("[notify-email] template not found", params.templateName);
    return { ok: false, reason: "template_not_found" };
  }

  const recipient = template.to || params.recipientEmail;
  if (!recipient) {
    console.error("[notify-email] no recipient");
    return { ok: false, reason: "no_recipient" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const messageId = crypto.randomUUID();
  const idempotencyKey = params.idempotencyKey || messageId;
  const normalizedEmail = recipient.toLowerCase();
  const templateData = params.templateData ?? {};

  // 1. Suppression check (fail-closed)
  const { data: suppressed, error: suppressionError } = await supabase
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (suppressionError) {
    console.error("[notify-email] suppression check failed", suppressionError);
    return { ok: false, reason: "suppression_check_failed" };
  }
  if (suppressed) {
    return { ok: false, reason: "email_suppressed" };
  }

  // 2. Get or create an unsubscribe token (one per address)
  let unsubscribeToken: string;
  const { data: existingToken } = await supabase
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token;
  } else {
    unsubscribeToken = generateToken();
    await supabase
      .from("email_unsubscribe_tokens")
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: "email", ignoreDuplicates: true },
      );
    const { data: storedToken } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (storedToken?.token) unsubscribeToken = storedToken.token;
  }

  // 3. Render template
  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function"
      ? template.subject(templateData)
      : template.subject;

  // 4. Log pending + enqueue
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: params.templateName,
    recipient_email: recipient,
    status: "pending",
  });

  const { error: enqueueError } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: "transactional",
      label: params.templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    console.error("[notify-email] enqueue failed", enqueueError);
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: params.templateName,
      recipient_email: recipient,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    return { ok: false, reason: "enqueue_failed" };
  }

  return { ok: true };
}
