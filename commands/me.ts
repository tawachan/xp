import { getMyTweets } from "../lib/x-client.ts";
import { cacheTweets } from "../lib/cache-store.ts";
import { formatTweetList } from "../lib/output.ts";

export interface MeOptions {
  limit?: string;
  beforeId?: string;
  afterId?: string;
  json?: boolean;
}

export async function meCommand(options: MeOptions = {}): Promise<void> {
  const { limit, beforeId, afterId, json = false } = options;
  // Default to API max (100) to minimize paid API calls — pricing is per-request, not per-tweet
  const maxResults = limit ? Number(limit) : 100;
  if (isNaN(maxResults) || maxResults < 5 || maxResults > 100) {
    throw new Error("Limit must be between 5 and 100 (default: 100)");
  }
  const tweets = await getMyTweets({ maxResults, beforeId, afterId });
  await cacheTweets(tweets);
  console.log(formatTweetList(tweets, json));
}
