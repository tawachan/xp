import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  afterEach,
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { threadCommand } from "./thread.ts";
import { services } from "../services.ts";
import { captureConsole, createMockServices, jsonResponse } from "../lib/test-helpers.ts";

describe("threadCommand", () => {
  let restoreConsole: (() => void) | undefined;
  const orig = { ...services };

  afterEach(() => {
    Object.assign(services, orig);
    restoreConsole?.();
    restoreConsole = undefined;
  });

  it("posts a thread with 2 tweets", async () => {
    let callIndex = 0;
    const mock = createMockServices({
      fetch: (_url, init) => {
        const body = JSON.parse(init?.body as string);
        callIndex++;
        if (callIndex === 1) {
          assertEquals(body.text, "First");
          assertEquals(body.reply, undefined);
          return jsonResponse({ data: { id: "111" } });
        }
        assertEquals(body.text, "Second");
        assertEquals(body.reply, { in_reply_to_tweet_id: "111" });
        return jsonResponse({ data: { id: "222" } });
      },
    });
    Object.assign(services, mock);

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await threadCommand(["First", "Second"]);
    assertEquals(output[0]!.includes("111"), true);
    assertEquals(output[0]!.includes("222"), true);
    assertEquals(output[0]!.includes("[1/2]"), true);
    assertEquals(output[0]!.includes("[2/2]"), true);
  });

  it("attaches images only to the first tweet", async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    let tweetCount = 0;
    const mock = createMockServices({
      files: new Map([
        ["cover.jpg", { size: 1024, data: new Uint8Array(1024) }],
      ]),
      fetch: (url, init) => {
        if (url === "https://api.x.com/2/media/upload") {
          return jsonResponse({ data: { id: "m_cover" } });
        }
        const body = JSON.parse(init?.body as string);
        requestBodies.push(body);
        tweetCount++;
        return jsonResponse({ data: { id: `${100 + tweetCount}` } });
      },
    });
    Object.assign(services, mock);

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await threadCommand(["First", "Second", "Third"], false, ["cover.jpg"]);

    assertEquals(requestBodies[0]!.media, { media_ids: ["m_cover"] });
    assertEquals(requestBodies[1]!.media, undefined);
    assertEquals(requestBodies[2]!.media, undefined);
    assertEquals(output[0]!.includes("[1/3]"), true);
  });

  it("rejects fewer than 2 texts", async () => {
    await assertRejects(
      () => threadCommand(["Only one"]),
      Error,
      "at least 2",
    );
  });

  it("rejects if any text exceeds 280 characters", async () => {
    await assertRejects(
      () => threadCommand(["OK", "x".repeat(281)]),
      Error,
      "too long",
    );
  });
});
