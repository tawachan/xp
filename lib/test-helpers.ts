import type { Services } from "../services.ts";
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

export function createMockServices(
  options: {
    fetch?: FetchHandler;
    files?: Map<string, { size: number; data: Uint8Array }>;
  } = {},
): Services {
  const mockFetch = options.fetch
    ? (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const handler = options.fetch!;
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request).url;
      return Promise.resolve(handler(url, init));
    }
    : (_input: string | URL | Request, _init?: RequestInit): Promise<Response> => {
      return Promise.reject(new Error("fetch not mocked"));
    };

  const fileMap = options.files;
  const mockStat = fileMap
    ? (path: string | URL): Promise<Deno.FileInfo> => {
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
    }
    : (path: string | URL): Promise<Deno.FileInfo> => {
      return Promise.reject(
        new Deno.errors.NotFound(
          `not found: ${typeof path === "string" ? path : path.toString()}`,
        ),
      );
    };

  const mockReadFile = fileMap
    ? (path: string | URL): Promise<Uint8Array> => {
      const p = typeof path === "string" ? path : path.toString();
      const f = fileMap.get(p);
      if (!f) {
        return Promise.reject(new Deno.errors.NotFound(`not found: ${p}`));
      }
      return Promise.resolve(f.data);
    }
    : (path: string | URL): Promise<Uint8Array> => {
      return Promise.reject(
        new Deno.errors.NotFound(
          `not found: ${typeof path === "string" ? path : path.toString()}`,
        ),
      );
    };

  return {
    loadConfig: () => Promise.resolve(TEST_CONFIG),
    cacheTweet: () => Promise.resolve(),
    cacheTweets: () => Promise.resolve(),
    fetch: mockFetch,
    stat: mockStat,
    readFile: mockReadFile,
  };
}
