import { getTweet } from "../lib/x-client.ts";
import { getCachedTweet, cacheTweet } from "../lib/cache-store.ts";
import { formatTweetData } from "../lib/output.ts";

export async function getCommand(tweetId: string, json = false): Promise<void> {
  const cached = await getCachedTweet(tweetId);
  if (cached) {
    console.log(formatTweetData(cached, json));
    return;
  }
  const tweet = await getTweet(tweetId);
  await cacheTweet(tweet);
  console.log(formatTweetData(tweet, json));
}
