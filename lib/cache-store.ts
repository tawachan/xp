import type { TweetData } from "./x-client.ts";
import { loadPartialConfig } from "./config-store.ts";

interface CachedTweet extends TweetData {
  cached_at: string;
}

type CacheData = Record<string, CachedTweet>;

function expandHome(path: string): string {
  if (path.startsWith("~")) {
    const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
    return home + path.slice(1);
  }
  return path;
}

function defaultCacheDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
  return `${home}/.config/xp/cache`;
}

async function getCacheDir(): Promise<string> {
  const config = await loadPartialConfig();
  if (config.cacheDir) {
    return expandHome(config.cacheDir);
  }
  return defaultCacheDir();
}

async function getCachePath(): Promise<string> {
  const dir = await getCacheDir();
  return `${dir}/tweets.json`;
}

async function loadCache(): Promise<CacheData> {
  try {
    const text = await Deno.readTextFile(await getCachePath());
    return JSON.parse(text) as CacheData;
  } catch {
    return {};
  }
}

async function saveCache(data: CacheData): Promise<void> {
  const dir = await getCacheDir();
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(await getCachePath(), JSON.stringify(data, null, 2));
}

function toTweetData({ cached_at: _, ...tweet }: CachedTweet): TweetData {
  return tweet;
}

export async function cacheTweet(tweet: TweetData): Promise<void> {
  const data = await loadCache();
  data[tweet.id] = { ...tweet, cached_at: new Date().toISOString() };
  await saveCache(data);
}

export async function cacheTweets(tweets: TweetData[]): Promise<void> {
  const data = await loadCache();
  const now = new Date().toISOString();
  for (const tweet of tweets) {
    data[tweet.id] = { ...tweet, cached_at: now };
  }
  await saveCache(data);
}

export async function getCachedTweet(id: string): Promise<TweetData | null> {
  const data = await loadCache();
  const cached = data[id];
  return cached ? toTweetData(cached) : null;
}

export async function listCachedTweets(): Promise<TweetData[]> {
  const data = await loadCache();
  return Object.values(data)
    .sort((a, b) => {
      const aKey = a.created_at ?? a.cached_at;
      const bKey = b.created_at ?? b.cached_at;
      return bKey > aKey ? 1 : -1;
    })
    .map(toTweetData);
}

export async function removeCachedTweet(id: string): Promise<void> {
  const data = await loadCache();
  delete data[id];
  await saveCache(data);
}

export async function clearCache(): Promise<void> {
  try {
    await Deno.remove(await getCachePath());
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return;
    }
    throw e;
  }
}
