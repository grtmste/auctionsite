/**
 * Client-side image processing applied before an upload begins:
 *  - downscales large images and re-encodes as JPEG (~0.82) to save storage
 *  - stamps a small "romu.ee" watermark in the bottom-right corner
 *
 * Runs in the browser (canvas). Non-images and any failure fall back to the
 * original file untouched, so uploads never break.
 */

const MAX_DIMENSION = 1920; // px, longest side
const JPEG_QUALITY = 0.82;
const WATERMARK_TEXT = "romu.ee";

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to <img> loader
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.round(w * 0.022);
  const fontSize = Math.max(13, Math.round(w * 0.028));
  ctx.save();
  ctx.font = `600 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = Math.round(fontSize * 0.35);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(WATERMARK_TEXT, w - pad, h - pad);
  ctx.restore();
}

export async function processImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Animated GIFs / SVGs would lose their nature through the canvas — skip.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await loadBitmap(file);
    const srcW = "width" in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth;
    const srcH = "height" in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight;
    if (!srcW || !srcH) return file;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH));
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
    if ("close" in bitmap) (bitmap as ImageBitmap).close();

    drawWatermark(ctx, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    // Only keep the processed version if it isn't larger than the original.
    if (blob.size >= file.size && scale === 1) {
      // still watermarked — prefer processed unless it's much bigger
      if (blob.size > file.size * 1.15) return file;
    }

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
