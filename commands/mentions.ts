import { getMyMentions } from "../lib/x-client.ts";
import { cacheTweets } from "../lib/cache-store.ts";
import { formatTweetList } from "../lib/output.ts";

export interface MentionsOptions {
  limit?: string;
  beforeId?: string;
  afterId?: string;
  json?: boolean;
}

export async function mentionsCommand(options: MentionsOptions = {}): Promise<void> {
  const { limit, beforeId, afterId, json = false } = options;
  const maxResults = limit ? Number(limit) : 10;
  if (isNaN(maxResults) || maxResults < 5 || maxResults > 100) {
    throw new Error("Limit must be between 5 and 100 (default: 10)");
  }
  const tweets = await getMyMentions({ maxResults, beforeId, afterId });
  await cacheTweets(tweets);
  console.log(formatTweetList(tweets, json));
}
