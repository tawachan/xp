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
import { main } from "./main.ts";
import { captureConsole, jsonResponse, stubServices } from "./lib/test-helpers.ts";

describe("main", () => {
  let restore: () => void;
  let restoreConsole: (() => void) | undefined;

  afterEach(() => {
    restore();
    restoreConsole?.();
    restoreConsole = undefined;
  });

  it("rejects --image with get command", async () => {
    restore = stubServices();

    await assertRejects(
      () => main(["get", "123", "--image", "photo.jpg"]),
      Error,
      "--image is not supported",
    );
  });

  it("rejects --image with delete command", async () => {
    restore = stubServices();

    await assertRejects(
      () => main(["delete", "123", "--image", "photo.jpg"]),
      Error,
      "--image is not supported",
    );
  });

  it("shorthand tweet posts via default branch", async () => {
    restore = stubServices({
      fetch: (url, init) => {
        if (url === "https://api.x.com/2/tweets") {
          const body = JSON.parse(init?.body as string);
          assertEquals(body.text, "Hello");
          return jsonResponse({ data: { id: "500" } });
        }
        return jsonResponse({}, 404);
      },
    });

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await main(["Hello"]);
    assertEquals(output.length, 1);
    assertEquals(output[0]!.includes("500"), true);
  });
});
