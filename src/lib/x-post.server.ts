// Server-only helper to publish a tweet to X (Twitter) via the v2 API using
// OAuth 1.0a user-context signing. Requires four secrets generated from an X
// developer app set to "Read and Write":
//   X_API_KEY            (consumer key)
//   X_API_SECRET         (consumer secret)
//   X_ACCESS_TOKEN       (user access token)
//   X_ACCESS_TOKEN_SECRET(user access token secret)
//
// The signing key is consumerSecret&tokenSecret. For a JSON request body the
// body is NOT part of the OAuth signature base string — only the oauth_*
// parameters (and any query params) are. HMAC-SHA1 is computed with Web Crypto,
// which is available in the server runtime.

const ENDPOINT = "https://api.twitter.com/2/tweets";

export type XPostResult =
  | { ok: true; id: string }
  | { ok: false; reason: string };

/** RFC 3986 percent-encoding (stricter than encodeURIComponent). */
function pct(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha1Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  let binary = "";
  const view = new Uint8Array(sig);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary);
}

function getCreds() {
  const consumerKey = process.env.X_API_KEY;
  const consumerSecret = process.env.X_API_SECRET;
  const token = process.env.X_ACCESS_TOKEN;
  const tokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (!consumerKey || !consumerSecret || !token || !tokenSecret) return null;
  return { consumerKey, consumerSecret, token, tokenSecret };
}

/** True when all four X credentials are configured. */
export function xCredentialsConfigured(): boolean {
  return getCreds() !== null;
}

async function buildAuthHeader(method: string, url: string): Promise<string | null> {
  const creds = getCreds();
  if (!creds) return null;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: randomNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.token,
    oauth_version: "1.0",
  };

  // Signature base string (no JSON body params, no query params here).
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${pct(k)}=${pct(oauthParams[k])}`)
    .join("&");
  const baseString = [
    method.toUpperCase(),
    pct(url),
    pct(paramString),
  ].join("&");
  const signingKey = `${pct(creds.consumerSecret)}&${pct(creds.tokenSecret)}`;
  const signature = await hmacSha1Base64(signingKey, baseString);

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };
  return (
    "OAuth " +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${pct(k)}="${pct(headerParams[k])}"`)
      .join(", ")
  );
}

/** Publish a single tweet. Returns the new post id or a clean error reason. */
export async function postToX(text: string): Promise<XPostResult> {
  try {
    const authHeader = await buildAuthHeader("POST", ENDPOINT);
    if (!authHeader) return { ok: false, reason: "credentials_missing" };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const raw = await res.text();
    if (!res.ok) {
      console.error("[x-post] X API error", res.status, raw.slice(0, 500));
      return { ok: false, reason: `x_api_${res.status}` };
    }

    let id = "";
    try {
      const parsed = JSON.parse(raw) as { data?: { id?: string } };
      id = parsed.data?.id ?? "";
    } catch {
      // ignore parse error; treat as success without id
    }
    return { ok: true, id };
  } catch (e) {
    console.error("[x-post] postToX failed", e);
    return { ok: false, reason: "request_failed" };
  }
}
