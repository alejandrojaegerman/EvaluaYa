import { withUtm } from "./site";

// Server-only helper that posts rich, deep-linked notifications to a single
// Slack channel via the Lovable connector gateway. This is the live "ops feed"
// for the site team and REPLACES the admin-only transactional emails.
//
// Every send is best-effort: missing config or a gateway error is logged and
// swallowed so it can never block a resident/engineer/admin action. Mirrors the
// fail-closed pattern used by sendSystemEmail.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

/** Default channel posted to when SLACK_NOTIFY_CHANNEL is not set. */
const DEFAULT_CHANNEL = "#evaluaya-alertas";

type RiskLevel = "green" | "yellow" | "orange" | "red";

const RISK_TAG: Record<RiskLevel, string> = {
  green: "🟢 Verde",
  yellow: "🟡 Amarillo",
  orange: "🟠 Naranja",
  red: "🔴 Rojo",
};

/** Returns a colored risk tag, falling back to the raw value when unknown. */
export function riskTag(level: string | null | undefined): string {
  if (!level) return "—";
  return RISK_TAG[level as RiskLevel] ?? level;
}

export type SlackField = { label: string; value: string };

export type SlackNotifyParams = {
  /** Leading emoji for the header, e.g. "🚨", "🛠️", "🙋", "✅", "💬", "📉". */
  emoji?: string;
  /** Short header line (no markdown). */
  title: string;
  /** Optional one-line context shown under the header. */
  context?: string;
  /** Key/value rows rendered in a two-column fields block. */
  fields?: SlackField[];
  /** Absolute or site-relative URL the action button opens. */
  url?: string;
  /** Label for the action button (defaults to "Abrir en EvalúaYa"). */
  buttonLabel?: string;
  /** When true, prepends <!channel> and enables link_names for an @channel ping. */
  urgent?: boolean;
};

function escapeText(s: string): string {
  // Slack mrkdwn escapes: & < >
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Posts a Block Kit message to the configured Slack channel. Returns
 * { ok: false } on any failure without throwing.
 */
export async function sendSlackNotification(
  params: SlackNotifyParams,
): Promise<{ ok: boolean; reason?: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  if (!lovableKey || !slackKey) {
    console.error("[slack-notify] missing gateway env (LOVABLE_API_KEY/SLACK_API_KEY)");
    return { ok: false, reason: "config" };
  }

  const channel = process.env.SLACK_NOTIFY_CHANNEL?.trim() || DEFAULT_CHANNEL;
  const emoji = params.emoji ? `${params.emoji} ` : "";

  // Build deep link with Slack attribution UTM (site-relative paths supported).
  let actionUrl: string | undefined;
  if (params.url) {
    actionUrl = /^https?:\/\//i.test(params.url)
      ? params.url
      : withUtm(params.url, {
          source: "slack",
          medium: "alert",
          campaign: "ops_feed",
        });
  }

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `${emoji}${params.title}`.slice(0, 150), emoji: true },
    },
  ];

  if (params.context) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: escapeText(params.context).slice(0, 1000) }],
    });
  }

  const fields = (params.fields ?? []).filter((f) => f.value);
  if (fields.length > 0) {
    // Slack allows up to 10 fields per section; chunk to be safe.
    for (let i = 0; i < fields.length; i += 10) {
      blocks.push({
        type: "section",
        fields: fields.slice(i, i + 10).map((f) => ({
          type: "mrkdwn",
          text: `*${escapeText(f.label)}*\n${escapeText(f.value)}`.slice(0, 2000),
        })),
      });
    }
  }

  if (actionUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: (params.buttonLabel ?? "Abrir en EvalúaYa").slice(0, 75),
            emoji: true,
          },
          url: actionUrl,
          style: params.urgent ? "danger" : "primary",
        },
      ],
    });
  }

  // Fallback notification text (used in push/notifications and as accessibility text).
  const fallback = `${emoji}${params.title}`;
  const text = params.urgent ? `<!channel> ${fallback}` : fallback;

  try {
    const res = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text,
        blocks,
        link_names: params.urgent ? true : undefined,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const body = await res.text();
    let json: { ok?: boolean; error?: string } = {};
    try {
      json = JSON.parse(body);
    } catch {
      console.error("[slack-notify] non-JSON response", res.status, body.slice(0, 300));
      return { ok: false, reason: "bad_response" };
    }
    if (!res.ok || !json.ok) {
      console.error("[slack-notify] post failed", res.status, json.error ?? body.slice(0, 300));
      return { ok: false, reason: json.error ?? "post_failed" };
    }
    return { ok: true };
  } catch (e) {
    console.error("[slack-notify] fetch failed", e);
    return { ok: false, reason: "fetch_failed" };
  }
}
