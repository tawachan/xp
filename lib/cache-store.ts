import type { TweetData } from "./x-client.ts";

interface CachedTweet extends TweetData {
  cached_at: string;
}

function getCacheDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
  return `${home}/.config/xp/cache/tweets`;
}

export async function cacheTweet(tweet: TweetData): Promise<void> {
  const dir = getCacheDir();
  await Deno.mkdir(dir, { recursive: true });
  const cached: CachedTweet = { ...tweet, cached_at: new Date().toISOString() };
  await Deno.writeTextFile(`${dir}/${tweet.id}.json`, JSON.stringify(cached, null, 2));
}

export async function cacheTweets(tweets: TweetData[]): Promise<void> {
  const dir = getCacheDir();
  await Deno.mkdir(dir, { recursive: true });
  const now = new Date().toISOString();
  for (const tweet of tweets) {
    const cached: CachedTweet = { ...tweet, cached_at: now };
    await Deno.writeTextFile(`${dir}/${tweet.id}.json`, JSON.stringify(cached, null, 2));
  }
}

export async function getCachedTweet(id: string): Promise<TweetData | null> {
  const path = `${getCacheDir()}/${id}.json`;
  try {
    const text = await Deno.readTextFile(path);
    const { cached_at: _, ...tweet } = JSON.parse(text) as CachedTweet;
    return tweet;
  } catch {
    return null;
  }
}

export async function listCachedTweets(): Promise<TweetData[]> {
  const dir = getCacheDir();
  const tweets: CachedTweet[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        const text = await Deno.readTextFile(`${dir}/${entry.name}`);
        tweets.push(JSON.parse(text) as CachedTweet);
      }
    }
  } catch {
    return [];
  }
  tweets.sort((a, b) => (b.cached_at > a.cached_at ? 1 : -1));
  return tweets.map(({ cached_at: _, ...tweet }) => tweet);
}

export async function removeCachedTweet(id: string): Promise<void> {
  const path = `${getCacheDir()}/${id}.json`;
  try {
    await Deno.remove(path);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return;
    }
    throw e;
  }
}

export async function clearCache(): Promise<void> {
  const dir = getCacheDir();
  try {
    await Deno.remove(dir, { recursive: true });
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return;
    }
    throw e;
  }
}
