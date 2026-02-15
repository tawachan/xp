import { services } from "./services.ts";
import type { XpConfig } from "./config-store.ts";

export const TEST_CONFIG: XpConfig = {
  apiKey: "test-api-key",
  apiSecret: "test-api-secret",
  accessToken: "test-access-token",
  accessTokenSecret: "test-access-token-secret",
};

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function captureConsole(): { output: string[]; restore: () => void } {
  const original = console.log;
  const output: string[] = [];
  console.log = (...args: unknown[]) => {
    output.push(args.map(String).join(" "));
  };
  return {
    output,
    restore: () => {
      console.log = original;
    },
  };
}

type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response>;

export function stubServices(
  options: {
    fetch?: FetchHandler;
    files?: Map<string, { size: number; data: Uint8Array }>;
  } = {},
): () => void {
  const orig = {
    loadConfig: services.loadConfig,
    cacheTweet: services.cacheTweet,
    cacheTweets: services.cacheTweets,
    fetch: services.fetch,
    stat: services.stat,
    readFile: services.readFile,
  };

  services.loadConfig = () => Promise.resolve(TEST_CONFIG);
  services.cacheTweet = () => Promise.resolve();
  services.cacheTweets = () => Promise.resolve();

  if (options.fetch) {
    const handler = options.fetch;
    services.fetch = (
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request).url;
      return Promise.resolve(handler(url, init));
    };
  }

  if (options.files) {
    const fileMap = options.files;
    services.stat = (path: string | URL): Promise<Deno.FileInfo> => {
      const p = typeof path === "string" ? path : path.toString();
      const f = fileMap.get(p);
      if (!f) {
        return Promise.reject(new Deno.errors.NotFound(`not found: ${p}`));
      }
      return Promise.resolve({
        size: f.size,
        isFile: true,
        isDirectory: false,
      } as Deno.FileInfo);
    };
    services.readFile = (path: string | URL): Promise<Uint8Array> => {
      const p = typeof path === "string" ? path : path.toString();
      const f = fileMap.get(p);
      if (!f) {
        return Promise.reject(new Deno.errors.NotFound(`not found: ${p}`));
      }
      return Promise.resolve(f.data);
    };
  }

  return () => {
    Object.assign(services, orig);
  };
}
