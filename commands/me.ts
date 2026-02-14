import { getMyTweets } from "../lib/x-client.ts";
import { cacheTweets } from "../lib/cache-store.ts";
import { formatTweetList } from "../lib/output.ts";

export async function meCommand(limit?: string, json = false): Promise<void> {
  const maxResults = limit ? parseInt(limit) : 10;
  if (isNaN(maxResults) || maxResults < 5 || maxResults > 100) {
    throw new Error("Limit must be between 5 and 100 (default: 10)");
  }
  const tweets = await getMyTweets(maxResults);
  await cacheTweets(tweets);
  console.log(formatTweetList(tweets, json));
}
