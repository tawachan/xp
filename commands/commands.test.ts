import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Commands } from "./commands.ts";
import { createMockServices, jsonResponse, captureConsole } from "../lib/test-helpers.ts";

Deno.test("Commands.tweet — posts and caches tweet", async () => {
  const cached: Array<{ id: string; text: string }> = [];
  const svc = createMockServices({
    fetch: async () => jsonResponse({ data: { id: "t1" } }),
    cacheTweet: async (tweet) => { cached.push(tweet); },
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.tweet("Hello", false);
    assertEquals(cached.length, 1);
    assertEquals(cached[0]!.id, "t1");
    assertEquals(cached[0]!.text, "Hello");
    assertEquals(c.logs.length, 1);
    assertEquals(c.logs[0]!.includes("t1"), true);
  } finally {
    c.restore();
  }
});

Deno.test("Commands.tweet — json output", async () => {
  const svc = createMockServices({
    fetch: async () => jsonResponse({ data: { id: "t1" } }),
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.tweet("Hello", true);
    const parsed = JSON.parse(c.logs[0]!);
    assertEquals(parsed.tweet_id, "t1");
    assertEquals(typeof parsed.url, "string");
  } finally {
    c.restore();
  }
});

Deno.test("Commands.tweet — rejects empty text", async () => {
  const cmds = new Commands(createMockServices());
  await assertRejects(
    () => cmds.tweet("", false),
    Error,
    "Text is required",
  );
});

Deno.test("Commands.tweet — rejects text over 280 chars", async () => {
  const cmds = new Commands(createMockServices());
  await assertRejects(
    () => cmds.tweet("a".repeat(281), false),
    Error,
    "Text is too long",
  );
});

Deno.test("Commands.reply — posts reply with tweet ID", async () => {
  let capturedBody = "";
  const svc = createMockServices({
    fetch: async (_input: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string ?? "";
      return jsonResponse({ data: { id: "r1" } });
    },
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.reply("100", "Reply text", false);
    const body = JSON.parse(capturedBody);
    assertEquals(body.reply, { in_reply_to_tweet_id: "100" });
    assertEquals(c.logs[0]!.includes("r1"), true);
  } finally {
    c.restore();
  }
});

Deno.test("Commands.thread — posts thread with chained replies", async () => {
  let callCount = 0;
  const bodies: string[] = [];
  const ids = ["100", "200", "300"];
  const svc = createMockServices({
    fetch: async (_input: string | URL | Request, init?: RequestInit) => {
      bodies.push(init?.body as string ?? "");
      return jsonResponse({ data: { id: ids[callCount++]! } });
    },
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.thread(["First", "Second", "Third"], false);
    assertEquals(callCount, 3);

    // First tweet has no reply
    const body1 = JSON.parse(bodies[0]!);
    assertEquals(body1.reply, undefined);

    // Second tweet replies to first
    const body2 = JSON.parse(bodies[1]!);
    assertEquals(body2.reply, { in_reply_to_tweet_id: "100" });

    // Third tweet replies to second
    const body3 = JSON.parse(bodies[2]!);
    assertEquals(body3.reply, { in_reply_to_tweet_id: "200" });

    assertEquals(c.logs.length, 1);
    assertEquals(c.logs[0]!.includes("[1/3]"), true);
    assertEquals(c.logs[0]!.includes("[3/3]"), true);
  } finally {
    c.restore();
  }
});

Deno.test("Commands.thread — rejects fewer than 2 texts", async () => {
  const cmds = new Commands(createMockServices());
  await assertRejects(
    () => cmds.thread(["Only one"], false),
    Error,
    "Thread requires at least 2 texts",
  );
});

Deno.test("Commands.get — returns cached tweet", async () => {
  const svc = createMockServices({
    getCachedTweet: async () => ({ id: "123", text: "Cached tweet" }),
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.get("123", false);
    assertEquals(c.logs[0]!.includes("Cached tweet"), true);
  } finally {
    c.restore();
  }
});

Deno.test("Commands.get — fetches from API when not cached", async () => {
  let fetchCalled = false;
  const svc = createMockServices({
    getCachedTweet: async () => null,
    fetch: async () => {
      fetchCalled = true;
      return jsonResponse({ data: { id: "123", text: "From API", created_at: "2024-01-01T00:00:00Z" } });
    },
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.get("123", false);
    assertEquals(fetchCalled, true);
    assertEquals(c.logs[0]!.includes("From API"), true);
  } finally {
    c.restore();
  }
});

Deno.test("Commands.me — fetches and caches tweets", async () => {
  const tweets = [
    { id: "1", text: "Tweet 1", created_at: "2024-01-01T00:00:00Z" },
    { id: "2", text: "Tweet 2", created_at: "2024-01-02T00:00:00Z" },
  ];
  const cachedTweets: Array<{ id: string; text: string }> = [];
  const svc = createMockServices({
    fetch: async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.includes("/users/me")) {
        return jsonResponse({ data: { id: "user1" } });
      }
      return jsonResponse({ data: tweets });
    },
    cacheTweets: async (ts) => { cachedTweets.push(...ts); },
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.me({ json: false });
    assertEquals(cachedTweets.length, 2);
    assertEquals(c.logs[0]!.includes("[1/2]"), true);
  } finally {
    c.restore();
  }
});

Deno.test("Commands.me — rejects invalid limit", async () => {
  const cmds = new Commands(createMockServices());
  await assertRejects(
    () => cmds.me({ limit: "3" }),
    Error,
    "Limit must be between 5 and 100",
  );
});

Deno.test("Commands.delete — deletes and removes from cache", async () => {
  let deleteUrl = "";
  let removedId = "";
  const svc = createMockServices({
    fetch: async (input: string | URL | Request, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        deleteUrl = input.toString();
      }
      return jsonResponse({ data: { deleted: true } });
    },
    removeCachedTweet: async (id) => { removedId = id; },
  });
  const cmds = new Commands(svc);
  const c = captureConsole();
  try {
    await cmds.delete("456", false);
    assertEquals(deleteUrl, "https://api.x.com/2/tweets/456");
    assertEquals(removedId, "456");
    assertEquals(c.logs[0]!.includes("456"), true);
  } finally {
    c.restore();
  }
});

Deno.test("Commands.delete — rejects empty ID", async () => {
  const cmds = new Commands(createMockServices());
  await assertRejects(
    () => cmds.delete("", false),
    Error,
    "Tweet ID is required",
  );
});
