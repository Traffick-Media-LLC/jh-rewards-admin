export function isValidType(type: string) {
  return ["image/jpeg", "image/png", "image/webp"].includes(type);
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function drawToCanvas(img: HTMLImageElement, maxDim: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  let { width, height } = img;
  const maxSide = Math.max(width, height);
  if (maxSide > maxDim) {
    const scale = maxDim / maxSide;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/webp",
  quality = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, type, quality);
  });
}
