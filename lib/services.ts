import { loadConfig } from "./config-store.ts";
import { cacheTweet, cacheTweets } from "./cache-store.ts";

export const services = {
  loadConfig,
  cacheTweet,
  cacheTweets,
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    return globalThis.fetch(input, init);
  },
  stat(path: string | URL): Promise<Deno.FileInfo> {
    return Deno.stat(path);
  },
  readFile(path: string | URL): Promise<Uint8Array> {
    return Deno.readFile(path);
  },
};
