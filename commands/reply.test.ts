import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  afterEach,
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { replyCommand } from "./reply.ts";
import { services } from "../services.ts";
import { captureConsole, createMockServices, jsonResponse } from "../lib/test-helpers.ts";

describe("replyCommand", () => {
  let restoreConsole: (() => void) | undefined;
  const orig = { ...services };

  afterEach(() => {
    Object.assign(services, orig);
    restoreConsole?.();
    restoreConsole = undefined;
  });

  it("replies to a tweet without image", async () => {
    const mock = createMockServices({
      fetch: (_url, init) => {
        const body = JSON.parse(init?.body as string);
        assertEquals(body.text, "Nice post!");
        assertEquals(body.reply, { in_reply_to_tweet_id: "12345" });
        return jsonResponse({ data: { id: "300" } });
      },
    });
    Object.assign(services, mock);

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await replyCommand("12345", "Nice post!");
    assertEquals(output[0]!.includes("300"), true);
  });

  it("replies with an image", async () => {
    const calls: string[] = [];
    const mock = createMockServices({
      files: new Map([
        ["reply.png", { size: 512, data: new Uint8Array(512) }],
      ]),
      fetch: (url, init) => {
        calls.push(url);
        if (url === "https://api.x.com/2/media/upload") {
          return jsonResponse({ data: { id: "m_reply" } });
        }
        const body = JSON.parse(init?.body as string);
        assertEquals(body.reply, { in_reply_to_tweet_id: "12345" });
        assertEquals(body.media, { media_ids: ["m_reply"] });
        return jsonResponse({ data: { id: "301" } });
      },
    });
    Object.assign(services, mock);

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await replyCommand("12345", "With image", false, ["reply.png"]);
    assertEquals(output[0]!.includes("301"), true);
    assertEquals(calls[0], "https://api.x.com/2/media/upload");
  });

  it("rejects empty text", async () => {
    await assertRejects(
      () => replyCommand("12345", ""),
      Error,
      "Text is required",
    );
  });

  it("rejects text over 280 characters", async () => {
    await assertRejects(
      () => replyCommand("12345", "x".repeat(281)),
      Error,
      "too long",
    );
  });
});
