import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { postTweet, getTweet, getMyTweets, deleteTweet, validateTweetId } from "./x-client.ts";
import { createMockServices, jsonResponse } from "./test-helpers.ts";

Deno.test("validateTweetId — accepts numeric ID", () => {
  validateTweetId("1234567890123456789");
});

Deno.test("validateTweetId — rejects non-numeric ID", () => {
  try {
    validateTweetId("abc");
    throw new Error("should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, 'Invalid tweet ID: "abc" (must be a numeric ID)');
  }
});

Deno.test("postTweet — sends text and returns id", async () => {
  let capturedUrl = "";
  let capturedBody = "";
  const svc = createMockServices({
    fetch: async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedBody = init?.body as string;
      return jsonResponse({ data: { id: "999" } });
    },
  });

  const result = await postTweet(svc, "Hello world");
  assertEquals(result, { id: "999" });
  assertEquals(capturedUrl, "https://api.x.com/2/tweets");
  const body = JSON.parse(capturedBody);
  assertEquals(body.text, "Hello world");
  assertEquals(body.reply, undefined);
  assertEquals(body.media, undefined);
});

Deno.test("postTweet — includes reply_to and media_ids", async () => {
  let capturedBody = "";
  const svc = createMockServices({
    fetch: async (_input: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return jsonResponse({ data: { id: "1000" } });
    },
  });

  const result = await postTweet(svc, "Reply text", "555", ["m1", "m2"]);
  assertEquals(result, { id: "1000" });
  const body = JSON.parse(capturedBody);
  assertEquals(body.reply, { in_reply_to_tweet_id: "555" });
  assertEquals(body.media, { media_ids: ["m1", "m2"] });
});

Deno.test("postTweet — validates reply-to ID", async () => {
  const svc = createMockServices();
  await assertRejects(
    () => postTweet(svc, "text", "invalid"),
    Error,
    "Invalid tweet ID",
  );
});

Deno.test("getTweet — returns tweet data", async () => {
  const tweetData = { id: "123", text: "Hello", created_at: "2024-01-01T00:00:00Z", author_id: "42" };
  const svc = createMockServices({
    fetch: async () => jsonResponse({ data: tweetData }),
  });

  const result = await getTweet(svc, "123");
  assertEquals(result, tweetData);
});

Deno.test("getTweet — throws on not found", async () => {
  const svc = createMockServices({
    fetch: async () => jsonResponse({ data: null }),
  });

  await assertRejects(
    () => getTweet(svc, "123"),
    Error,
    "Tweet not found: 123",
  );
});

Deno.test("getTweet — throws on 401", async () => {
  const svc = createMockServices({
    fetch: async () => jsonResponse({ detail: "Unauthorized" }, 401),
  });

  await assertRejects(
    () => getTweet(svc, "123"),
    Error,
    "Authentication failed",
  );
});

Deno.test("getTweet — throws on 403 read", async () => {
  const svc = createMockServices({
    fetch: async () => jsonResponse({ detail: "Forbidden" }, 403),
  });

  await assertRejects(
    () => getTweet(svc, "123"),
    Error,
    "paid X API plan",
  );
});

Deno.test("getTweet — throws on 429", async () => {
  const svc = createMockServices({
    fetch: async () => new Response(JSON.stringify({ detail: "Rate limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
  });

  await assertRejects(
    () => getTweet(svc, "123"),
    Error,
    "Rate limit exceeded",
  );
});

Deno.test("getMyTweets — returns tweets", async () => {
  const tweets = [
    { id: "1", text: "First", created_at: "2024-01-01T00:00:00Z" },
    { id: "2", text: "Second", created_at: "2024-01-02T00:00:00Z" },
  ];
  let callCount = 0;
  const svc = createMockServices({
    fetch: async (input: string | URL | Request) => {
      callCount++;
      const url = input.toString();
      if (url.includes("/users/me")) {
        return jsonResponse({ data: { id: "user1" } });
      }
      return jsonResponse({ data: tweets });
    },
  });

  const result = await getMyTweets(svc, { maxResults: 10 });
  assertEquals(result, tweets);
  assertEquals(callCount, 2);
});

Deno.test("getMyTweets — returns empty array when no tweets", async () => {
  const svc = createMockServices({
    fetch: async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.includes("/users/me")) {
        return jsonResponse({ data: { id: "user1" } });
      }
      return jsonResponse({});
    },
  });

  const result = await getMyTweets(svc);
  assertEquals(result, []);
});

Deno.test("deleteTweet — sends DELETE request", async () => {
  let capturedMethod = "";
  let capturedUrl = "";
  const svc = createMockServices({
    fetch: async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedMethod = init?.method ?? "";
      return jsonResponse({ data: { deleted: true } });
    },
  });

  await deleteTweet(svc, "123");
  assertEquals(capturedMethod, "DELETE");
  assertEquals(capturedUrl, "https://api.x.com/2/tweets/123");
});

Deno.test("deleteTweet — validates tweet ID", async () => {
  const svc = createMockServices();
  await assertRejects(
    () => deleteTweet(svc, "not-a-number"),
    Error,
    "Invalid tweet ID",
  );
});

Deno.test("postTweet — throws on 403 write", async () => {
  const svc = createMockServices({
    fetch: async () => jsonResponse({ detail: "Forbidden" }, 403),
  });

  await assertRejects(
    () => postTweet(svc, "Hello"),
    Error,
    "Permission denied",
  );
});

Deno.test("postTweet — throws on 400 with detail", async () => {
  const svc = createMockServices({
    fetch: async () => jsonResponse({ detail: "Duplicate content" }, 400),
  });

  await assertRejects(
    () => postTweet(svc, "Hello"),
    Error,
    "Bad request: Duplicate content",
  );
});
