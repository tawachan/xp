import { postTweet } from "../lib/x-client.ts";
import { services } from "../services.ts";
import { formatThreadResult } from "../lib/output.ts";
import { uploadAllMedia } from "../lib/media-upload.ts";

export async function threadCommand(texts: string[], json = false, imagePaths?: string[]): Promise<void> {
  if (texts.length < 2) {
    throw new Error("Thread requires at least 2 texts");
  }
  for (const [i, text] of texts.entries()) {
    if (text.length > 280) {
      throw new Error(`Text ${i + 1} is too long (${text.length}/280 characters)`);
    }
  }

  // Upload images for the first tweet only
  const mediaIds = imagePaths?.length ? await uploadAllMedia(imagePaths) : undefined;

  const results: Array<{ id: string }> = [];
  let previousId: string | undefined;
  const now = new Date().toISOString();

  for (let i = 0; i < texts.length; i++) {
    const result = await postTweet(texts[i]!, previousId, i === 0 ? mediaIds : undefined);
    results.push(result);
    await services.cacheTweet({ id: result.id, text: texts[i]!, created_at: now });
    previousId = result.id;
  }

  console.log(formatThreadResult(results, json));
}
