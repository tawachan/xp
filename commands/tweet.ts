import { postTweet } from "../lib/x-client.ts";
import { cacheTweet } from "../lib/cache-store.ts";
import { formatTweetResult } from "../lib/output.ts";
import { uploadAllMedia } from "../lib/media-upload.ts";

export async function tweetCommand(text: string, json = false, imagePaths?: string[]): Promise<void> {
  if (!text) {
    throw new Error("Text is required");
  }
  if (text.length > 280) {
    throw new Error(`Text is too long (${text.length}/280 characters)`);
  }
  const mediaIds = imagePaths?.length ? await uploadAllMedia(imagePaths) : undefined;
  const result = await postTweet(text, undefined, mediaIds);
  await cacheTweet({ id: result.id, text, created_at: new Date().toISOString() });
  console.log(formatTweetResult(result, json));
}
