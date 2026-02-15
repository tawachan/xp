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
import { tweetCommand } from "./tweet.ts";
import { captureConsole, jsonResponse, stubServices } from "../lib/test-helpers.ts";

describe("tweetCommand", () => {
  let restore: () => void;
  let restoreConsole: (() => void) | undefined;

  afterEach(() => {
    restore();
    restoreConsole?.();
    restoreConsole = undefined;
  });

  it("posts a text-only tweet", async () => {
    restore = stubServices({
      fetch: (url, init) => {
        if (url === "https://api.x.com/2/tweets") {
          const body = JSON.parse(init?.body as string);
          assertEquals(body.text, "Hello!");
          return jsonResponse({ data: { id: "100" } });
        }
        return jsonResponse({}, 404);
      },
    });

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await tweetCommand("Hello!");
    assertEquals(output.length, 1);
    assertEquals(output[0]!.includes("100"), true);
  });

  it("posts a tweet with an image", async () => {
    const calls: string[] = [];
    restore = stubServices({
      files: new Map([
        ["img.jpg", { size: 1024, data: new Uint8Array(1024) }],
      ]),
      fetch: (url, init) => {
        calls.push(url);
        if (url === "https://api.x.com/2/media/upload") {
          return jsonResponse({ data: { id: "media_1" } });
        }
        if (url === "https://api.x.com/2/tweets") {
          const body = JSON.parse(init?.body as string);
          assertEquals(body.media, { media_ids: ["media_1"] });
          return jsonResponse({ data: { id: "200" } });
        }
        return jsonResponse({}, 404);
      },
    });

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await tweetCommand("With image", false, ["img.jpg"]);
    assertEquals(output[0]!.includes("200"), true);
    assertEquals(calls[0], "https://api.x.com/2/media/upload");
    assertEquals(calls[1], "https://api.x.com/2/tweets");
  });

  it("rejects empty text", async () => {
    restore = stubServices();

    await assertRejects(
      () => tweetCommand(""),
      Error,
      "Text is required",
    );
  });

  it("rejects text over 280 characters", async () => {
    restore = stubServices();
    const longText = "a".repeat(281);

    await assertRejects(
      () => tweetCommand(longText),
      Error,
      "too long",
    );
  });
});
