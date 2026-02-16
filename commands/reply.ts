import { postTweet, getMyUserId } from "../lib/x-client.ts";
import { cacheTweet } from "../lib/cache-store.ts";
import { formatTweetResult } from "../lib/output.ts";
import { uploadAllMedia } from "../lib/media-upload.ts";

export async function replyCommand(tweetId: string, text: string, json = false, imagePaths?: string[]): Promise<void> {
  if (!text) {
    throw new Error("Text is required");
  }
  if (text.length > 280) {
    throw new Error(`Text is too long (${text.length}/280 characters)`);
  }
  const mediaIds = imagePaths?.length ? await uploadAllMedia(imagePaths) : undefined;
  const result = await postTweet(text, tweetId, mediaIds);
  let authorId: string | undefined;
  try {
    authorId = await getMyUserId();
  } catch {
    // best-effort: skip author_id if lookup fails
  }
  await cacheTweet({ id: result.id, text, created_at: new Date().toISOString(), author_id: authorId });
  console.log(formatTweetResult(result, json));
}
