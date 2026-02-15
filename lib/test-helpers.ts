import type { Services } from "./services.ts";
import type { TweetData } from "./x-client.ts";

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const MOCK_CONFIG = {
  apiKey: "test-api-key",
  apiSecret: "test-api-secret",
  accessToken: "test-access-token",
  accessTokenSecret: "test-access-token-secret",
};

export function createMockServices(overrides: Partial<Services> = {}): Services {
  const cache = new Map<string, TweetData>();

  return {
    fetch: () => Promise.resolve(jsonResponse({ data: { id: "1" } })),
    stat: () => Promise.resolve({ size: 1024, isFile: true, isDirectory: false, isSymlink: false } as Deno.FileInfo),
    readFile: () => Promise.resolve(new Uint8Array([0xFF, 0xD8, 0xFF])),
    loadConfig: () => Promise.resolve(MOCK_CONFIG),
    cacheTweet: async (tweet: TweetData) => { cache.set(tweet.id, tweet); },
    cacheTweets: async (tweets: TweetData[]) => { for (const t of tweets) cache.set(t.id, t); },
    getCachedTweet: async (id: string) => cache.get(id) ?? null,
    removeCachedTweet: async (id: string) => { cache.delete(id); },
    ...overrides,
  };
}

export function captureConsole(): { logs: string[]; restore: () => void } {
  const logs: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
  return {
    logs,
    restore: () => { console.log = original; },
  };
}
