import { deleteTweet } from "../lib/x-client.ts";
import { removeCachedTweet } from "../lib/cache-store.ts";
import { formatDeleteResult } from "../lib/output.ts";

export async function deleteCommand(tweetId: string, json = false): Promise<void> {
  if (!tweetId) {
    throw new Error("Tweet ID is required");
  }
  await deleteTweet(tweetId);
  await removeCachedTweet(tweetId);
  console.log(formatDeleteResult(tweetId, json));
}
