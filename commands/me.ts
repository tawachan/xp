import { getMyTweets } from "../lib/x-client.ts";
import { formatTweetList } from "../lib/output.ts";

export async function meCommand(limit?: string): Promise<void> {
  const maxResults = limit ? parseInt(limit) : 10;
  if (isNaN(maxResults) || maxResults < 5 || maxResults > 100) {
    throw new Error("Limit must be between 5 and 100 (default: 10)");
  }
  const tweets = await getMyTweets(maxResults);
  console.log(formatTweetList(tweets));
}
