import { buildAuthHeader } from "./oauth.ts";
import { loadConfig } from "./config-store.ts";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 4;
const ALLOWED_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export function validateImagePaths(paths: string[]): void {
  if (paths.length > MAX_IMAGES) {
    throw new Error(`Too many images (${paths.length}/${MAX_IMAGES} max)`);
  }
}

export async function uploadMedia(filePath: string): Promise<string> {
  // Check file exists
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check file size
  if (stat.size > MAX_FILE_SIZE) {
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File too large: ${filePath} (${sizeMB}MB, max 5MB)`);
  }

  // Check MIME type
  const ext = filePath.toLowerCase().match(/\.\w+$/)?.[0] ?? "";
  const mimeType = ALLOWED_TYPES[ext];
  if (!mimeType) {
    throw new Error(`Unsupported image format: ${ext || "unknown"} (supported: JPG, PNG, GIF, WebP)`);
  }

  const config = await loadConfig();
  const url = "https://api.x.com/2/media/upload";

  // Build multipart form data
  const fileData = await Deno.readFile(filePath);
  const form = new FormData();
  form.append("media", new Blob([fileData], { type: mimeType }), filePath.split("/").pop());
  form.append("media_category", "tweet_image");

  // OAuth 1.0a — no params in signature for multipart requests
  const authHeader = await buildAuthHeader("POST", url, config);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: form,
  });

  if (!res.ok) {
    const detail = await parseUploadError(res);
    throw new Error(`Media upload failed (${res.status}): ${detail}`);
  }

  const json = await res.json();
  return json.id;
}

async function parseUploadError(res: Response): Promise<string> {
  try {
    const body = await res.text();
    const json = JSON.parse(body);
    if (json.detail) return json.detail;
    if (json.errors?.[0]?.message) return json.errors[0].message;
    return body;
  } catch {
    return "Unknown error";
  }
}

export async function uploadAllMedia(paths: string[]): Promise<string[]> {
  validateImagePaths(paths);
  const mediaIds: string[] = [];
  for (const path of paths) {
    const id = await uploadMedia(path);
    mediaIds.push(id);
  }
  return mediaIds;
}
