/**
 * True when the picked file is an actual image type (image/jpeg, image/png,
 * image/webp, …). Rejects PDFs, videos, and anything else the OS file picker
 * might let through.
 */
export function isImageFile(file: File): boolean {
  return typeof file.type === "string" && file.type.startsWith("image/");
}

/**
 * Verify a data URL actually decodes into a visible raster image. Guards
 * against corrupt files, 0-byte captures, or formats the browser can't render.
 */
export function verifyImageLoads(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

/**
 * Compress an image File to a JPEG data URL, resized to fit within maxDim
 * and quality ~0.6, to keep uploads light on low-bandwidth connections.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDim = 1024,
  quality = 0.6,
): Promise<string> {
  const bitmap = await loadBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  return canvas.toDataURL("image/jpeg", quality);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> */
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

function fitWithin(w: number, h: number, maxDim: number) {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const scale = Math.min(maxDim / w, maxDim / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}
