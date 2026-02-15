import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  deleteTweet,
  getTweet,
  parseErrorDetail,
  postTweet,
  validateTweetId,
} from "./x-client.ts";
import { jsonResponse, stubServices } from "./test-helpers.ts";

describe("validateTweetId", () => {
  let restore: () => void;

  beforeEach(() => {
    restore = stubServices();
  });
  afterEach(() => {
    restore();
  });

  it("accepts valid numeric IDs", () => {
    validateTweetId("1234567890");
    validateTweetId("1");
    validateTweetId("0");
  });

  it("rejects non-numeric strings", () => {
    const invalid = ["abc", "", "12.34"];
    for (const id of invalid) {
      try {
        validateTweetId(id);
        throw new Error(`Expected error for: "${id}"`);
      } catch (e) {
        assertEquals(e instanceof Error, true);
        assertEquals(
          (e as Error).message.includes("Invalid tweet ID"),
          true,
          `Expected "Invalid tweet ID" in message for "${id}", got: ${
            (e as Error).message
          }`,
        );
      }
    }
  });
});

describe("postTweet", () => {
  let restore: () => void;

  afterEach(() => {
    restore();
  });

  it("posts a text-only tweet", async () => {
    restore = stubServices({
      fetch: (url, init) => {
        assertEquals(url, "https://api.x.com/2/tweets");
        assertEquals(init?.method, "POST");
        const body = JSON.parse(init?.body as string);
        assertEquals(body.text, "Hello world");
        assertEquals(body.reply, undefined);
        assertEquals(body.media, undefined);
        return jsonResponse({ data: { id: "111" } });
      },
    });

    const result = await postTweet("Hello world");
    assertEquals(result.id, "111");
  });

  it("posts a tweet with replyToId", async () => {
    restore = stubServices({
      fetch: (_url, init) => {
        const body = JSON.parse(init?.body as string);
        assertEquals(body.reply, { in_reply_to_tweet_id: "999" });
        return jsonResponse({ data: { id: "222" } });
      },
    });

    const result = await postTweet("Reply text", "999");
    assertEquals(result.id, "222");
  });

  it("posts a tweet with mediaIds", async () => {
    restore = stubServices({
      fetch: (_url, init) => {
        const body = JSON.parse(init?.body as string);
        assertEquals(body.media, { media_ids: ["m1", "m2"] });
        return jsonResponse({ data: { id: "333" } });
      },
    });

    const result = await postTweet("With images", undefined, ["m1", "m2"]);
    assertEquals(result.id, "333");
  });

  it("throws on 401 Unauthorized", async () => {
    restore = stubServices({
      fetch: () => jsonResponse({ detail: "Unauthorized" }, 401),
    });

    await assertRejects(
      () => postTweet("test"),
      Error,
      "Authentication failed",
    );
  });

  it("throws on 403 Forbidden (write)", async () => {
    restore = stubServices({
      fetch: () => jsonResponse({ detail: "Forbidden" }, 403),
    });

    await assertRejects(
      () => postTweet("test"),
      Error,
      "Permission denied",
    );
  });

  it("throws on 429 Rate limit", async () => {
    const resetTime = Math.floor(Date.now() / 1000) + 300;
    restore = stubServices({
      fetch: () =>
        new Response(JSON.stringify({ detail: "Too Many Requests" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "x-rate-limit-reset": resetTime.toString(),
          },
        }),
    });

    await assertRejects(
      () => postTweet("test"),
      Error,
      "Rate limit exceeded",
    );
  });
});

describe("getTweet", () => {
  let restore: () => void;

  afterEach(() => {
    restore();
  });

  it("fetches a tweet by ID", async () => {
    restore = stubServices({
      fetch: (url) => {
        assertEquals(url.includes("tweets/123"), true);
        return jsonResponse({
          data: {
            id: "123",
            text: "Hello",
            created_at: "2024-01-01T00:00:00Z",
          },
        });
      },
    });

    const tweet = await getTweet("123");
    assertEquals(tweet.id, "123");
    assertEquals(tweet.text, "Hello");
  });

  it("throws on 404 Not found", async () => {
    restore = stubServices({
      fetch: () => jsonResponse({ detail: "Not Found" }, 404),
    });

    await assertRejects(
      () => getTweet("999"),
      Error,
      "Not found",
    );
  });

  it("throws on 403 with paid plan message (read)", async () => {
    restore = stubServices({
      fetch: () => jsonResponse({ detail: "Forbidden" }, 403),
    });

    await assertRejects(
      () => getTweet("123"),
      Error,
      "paid X API plan",
    );
  });
});

describe("deleteTweet", () => {
  let restore: () => void;

  afterEach(() => {
    restore();
  });

  it("sends DELETE request with correct URL", async () => {
    restore = stubServices({
      fetch: (url, init) => {
        assertEquals(url, "https://api.x.com/2/tweets/456");
        assertEquals(init?.method, "DELETE");
        return jsonResponse({ data: { deleted: true } });
      },
    });

    await deleteTweet("456");
  });
});

describe("parseErrorDetail", () => {
  let restore: () => void;

  beforeEach(() => {
    restore = stubServices();
  });
  afterEach(() => {
    restore();
  });

  it("parses detail field", async () => {
    const res = new Response(JSON.stringify({ detail: "Some error" }));
    assertEquals(await parseErrorDetail(res), "Some error");
  });

  it("parses errors array message", async () => {
    const res = new Response(
      JSON.stringify({ errors: [{ message: "Bad request" }] }),
    );
    assertEquals(await parseErrorDetail(res), "Bad request");
  });

  it("returns 'Unknown error' for non-JSON response", async () => {
    const res = new Response("plain text error");
    assertEquals(await parseErrorDetail(res), "Unknown error");
  });
});
