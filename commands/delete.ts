import { deleteTweet } from "../lib/x-client.ts";
import { removeCachedTweet } from "../lib/cache-store.ts";
import { formatDeleteResult } from "../lib/output.ts";
import { services } from "../services.ts";

export async function deleteCommand(tweetId: string, json = false): Promise<void> {
  if (!tweetId) {
    throw new Error("Tweet ID is required");
  }
  await deleteTweet(services, tweetId);
  await removeCachedTweet(tweetId);
  console.log(formatDeleteResult(tweetId, json));
}
