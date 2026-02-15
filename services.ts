import { loadConfig } from "./lib/config-store.ts";
import { cacheTweet, cacheTweets } from "./lib/cache-store.ts";
import type { XpConfig } from "./lib/config-store.ts";
import type { TweetData } from "./lib/x-client.ts";

export interface Services {
  loadConfig(): Promise<XpConfig>;
  cacheTweet(tweet: TweetData): Promise<void>;
  cacheTweets(tweets: TweetData[]): Promise<void>;
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  stat(path: string | URL): Promise<Deno.FileInfo>;
  readFile(path: string | URL): Promise<Uint8Array>;
}

export const services: Services = createServices();

export function createServices(): Services {
  return {
    loadConfig,
    cacheTweet,
    cacheTweets,
    fetch(
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> {
      return globalThis.fetch(input, init);
    },
    stat(path: string | URL): Promise<Deno.FileInfo> {
      return Deno.stat(path);
    },
    readFile(path: string | URL): Promise<Uint8Array> {
      return Deno.readFile(path);
    },
  };
}
