export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export interface PreparedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

/** Validates and downscales an image entirely in the browser before upload. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type. Use PNG, JPEG, WEBP or GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 5 MB. Please choose a smaller file.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Invalid image."));
      el.src = dataUrl;
    });
    const max = 1024;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", 0.85);
    return { dataUrl: out, base64: out.split(",")[1] ?? "", mimeType: "image/jpeg" };
  } catch {
    return {
      dataUrl,
      base64: dataUrl.split(",")[1] ?? "",
      mimeType: file.type === "image/jpg" ? "image/jpeg" : file.type,
    };
  }
}

export function thumbnail(dataUrl: string, size = 220): Promise<string> {
  return new Promise((resolve) => {
    const el = new Image();
    el.onload = () => {
      const scale = Math.min(1, size / Math.max(el.width, el.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(el.width * scale);
      canvas.height = Math.round(el.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    el.onerror = () => resolve(dataUrl);
    el.src = dataUrl;
  });
}
