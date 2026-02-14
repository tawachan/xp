import { getCachedTweet, listCachedTweets, clearCache } from "../lib/cache-store.ts";
import { formatTweetData, formatTweetList } from "../lib/output.ts";

export async function cacheListCommand(json = false): Promise<void> {
  const tweets = await listCachedTweets();
  console.log(formatTweetList(tweets, json));
}

export async function cacheShowCommand(tweetId: string, json = false): Promise<void> {
  const tweet = await getCachedTweet(tweetId);
  if (!tweet) {
    throw new Error(`Tweet not found in cache: ${tweetId}`);
  }
  console.log(formatTweetData(tweet, json));
}

export async function cacheClearCommand(): Promise<void> {
  await clearCache();
  console.log("Cache cleared");
}
