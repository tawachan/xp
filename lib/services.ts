import type { OAuthCredentials } from "./oauth.ts";
import type { TweetData } from "./x-client.ts";
import { loadConfig } from "./config-store.ts";
import {
  cacheTweet,
  cacheTweets,
  getCachedTweet,
  removeCachedTweet,
} from "./cache-store.ts";

export interface Services {
  fetch: typeof globalThis.fetch;
  stat: typeof Deno.stat;
  readFile: typeof Deno.readFile;
  loadConfig(): Promise<OAuthCredentials>;
  cacheTweet(tweet: TweetData): Promise<void>;
  cacheTweets(tweets: TweetData[]): Promise<void>;
  getCachedTweet(id: string): Promise<TweetData | null>;
  removeCachedTweet(id: string): Promise<void>;
}

export function createServices(): Services {
  return {
    fetch: globalThis.fetch.bind(globalThis),
    stat: Deno.stat.bind(Deno),
    readFile: Deno.readFile.bind(Deno),
    loadConfig,
    cacheTweet,
    cacheTweets,
    getCachedTweet,
    removeCachedTweet,
  };
}
