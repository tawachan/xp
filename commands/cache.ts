import { getCachedTweet, listCachedTweets, clearCache } from "../lib/cache-store.ts";
import { formatTweetData, formatTweetList } from "../lib/output.ts";

export interface CacheListOptions {
  limit?: string;
  year?: string;
  month?: string;
  json?: boolean;
}

export async function cacheListCommand(options: CacheListOptions = {}): Promise<void> {
  const { limit, year, month, json = false } = options;

  if (month && !year) {
    throw new Error("--month requires --year");
  }

  if (limit !== undefined) {
    const n = Number(limit);
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error(`Invalid limit: "${limit}" (must be a positive integer)`);
    }
  }

  if (year !== undefined) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1000 || y > 9999) {
      throw new Error(`Invalid year: "${year}" (must be a 4-digit year)`);
    }
  }

  if (month !== undefined) {
    const m = Number(month);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      throw new Error(`Invalid month: "${month}" (must be 1-12)`);
    }
  }

  let tweets = await listCachedTweets();

  if (year) {
    const y = Number(year);
    tweets = tweets.filter((t) => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      if (month) {
        return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === Number(month);
      }
      return d.getUTCFullYear() === y;
    });
  }

  if (limit) {
    tweets = tweets.slice(0, Number(limit));
  }

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
