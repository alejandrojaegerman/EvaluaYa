import type { RiskLevel } from "./assessment-types";
import { RISK_HEX } from "./risk";

/**
 * Client-side branded share cards rendered on a <canvas>. We export a PNG
 * Blob and share it as an image file via the Web Share API when available
 * (so it lands as a real image in WhatsApp), falling back to a download.
 *
 * No server/edge raster generation is involved — this runs entirely in the
 * browser, which keeps it reliable on this stack and works on mobile.
 */

const W = 1080;
const H = 1080;

const BRAND_TEAL = "#0f3443";
const BRAND_TEAL_2 = "#15616d";
const INK = "#0f2027";
const MUTED = "#5b6b73";

function rgb([r, g, b]: [number, number, number]) {
  return `rgb(${r}, ${g}, ${b})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function newCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.textBaseline = "alphabetic";
  return { canvas, ctx };
}

function wordmark(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.font = "800 46px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("EvalúaYa", 72, 110);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
      0.92,
    );
  });
}

export type ResultCardInput = {
  riskLevel: RiskLevel;
  tag: string;
  action: string;
  url: string;
  footer: string;
};

/** Personalized result card: big risk block + recommended action. */
export async function generateResultCard(input: ResultCardInput): Promise<Blob> {
  const { canvas, ctx } = newCanvas();
  const accent = rgb(RISK_HEX[input.riskLevel]);

  // Background
  ctx.fillStyle = "#f7f9fa";
  ctx.fillRect(0, 0, W, H);

  wordmark(ctx, BRAND_TEAL);

  // Risk block
  const blockX = 72;
  const blockY = 180;
  const blockW = W - 144;
  const blockH = 560;
  roundRect(ctx, blockX, blockY, blockW, blockH, 48);
  ctx.fillStyle = accent;
  ctx.fill();

  // Risk dot + tag
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 40px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(input.tag.toUpperCase(), W / 2, blockY + 150);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 88px 'Plus Jakarta Sans', system-ui, sans-serif";
  wrapText(ctx, input.action, W / 2, blockY + 300, blockW - 120, 96);

  // Footer caption
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = "600 40px 'Inter', system-ui, sans-serif";
  wrapText(ctx, input.footer, W / 2, 840, W - 200, 52);

  ctx.fillStyle = MUTED;
  ctx.font = "600 36px 'Inter', system-ui, sans-serif";
  ctx.fillText(cleanUrl(input.url), W / 2, 1010);

  return toBlob(canvas);
}

export type StatsCardInput = {
  total: number;
  red: number;
  orange: number;
  yellow: number;
  green: number;
  headline: string;
  topAreaLabel?: string;
  cta: string;
  url: string;
};

/** Community stats card for the map page. */
export async function generateStatsCard(input: StatsCardInput): Promise<Blob> {
  const { canvas, ctx } = newCanvas();

  // Teal gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, BRAND_TEAL);
  grad.addColorStop(1, BRAND_TEAL_2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  wordmark(ctx, "#ffffff");

  // Big total
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 200px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(input.total.toLocaleString(), W / 2, 380);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 44px 'Inter', system-ui, sans-serif";
  wrapText(ctx, input.headline, W / 2, 460, W - 160, 56);

  // Risk distribution bar
  const barX = 96;
  const barY = 560;
  const barW = W - 192;
  const barH = 56;
  const sum = Math.max(
    1,
    input.red + input.orange + input.yellow + input.green,
  );
  const segs: Array<[RiskLevel, number]> = [
    ["red", input.red],
    ["orange", input.orange],
    ["yellow", input.yellow],
    ["green", input.green],
  ];
  let cx = barX;
  roundRect(ctx, barX, barY, barW, barH, 28);
  ctx.save();
  ctx.clip();
  for (const [level, val] of segs) {
    const segW = (val / sum) * barW;
    ctx.fillStyle = rgb(RISK_HEX[level]);
    ctx.fillRect(cx, barY, segW + 1, barH);
    cx += segW;
  }
  ctx.restore();

  // Legend
  ctx.font = "700 32px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  const cellW = barW / 4;
  const legend: Array<[RiskLevel, number]> = [
    ["red", input.red],
    ["orange", input.orange],
    ["yellow", input.yellow],
    ["green", input.green],
  ];
  legend.forEach(([level, val], i) => {
    ctx.fillStyle = rgb(RISK_HEX[level]);
    ctx.fillText(val.toLocaleString(), barX + cellW * i + cellW / 2, barY + 150);
  });

  if (input.topAreaLabel) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "600 40px 'Inter', system-ui, sans-serif";
    wrapText(ctx, input.topAreaLabel, W / 2, 820, W - 160, 52);
  }

  // CTA
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 42px 'Plus Jakarta Sans', system-ui, sans-serif";
  wrapText(ctx, input.cta, W / 2, 940, W - 160, 52);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 34px 'Inter', system-ui, sans-serif";
  ctx.fillText(cleanUrl(input.url), W / 2, 1020);

  return toBlob(canvas);
}

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

export type ShareImageResult = "shared" | "downloaded";

/**
 * Share an image blob via the Web Share API (with files) when supported,
 * otherwise download it so the user can attach it manually.
 */
export async function shareImageBlob(
  blob: Blob,
  opts: { filename: string; title: string; text: string },
): Promise<ShareImageResult> {
  const file = new File([blob], opts.filename, { type: blob.type });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (
    typeof nav.share === "function" &&
    typeof nav.canShare === "function" &&
    nav.canShare({ files: [file] })
  ) {
    try {
      await nav.share({ files: [file], title: opts.title, text: opts.text });
      return "shared";
    } catch (err) {
      // User cancelled — treat as done, don't force a download.
      if ((err as Error)?.name === "AbortError") return "shared";
      /* fall through to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
