import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  afterEach,
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { main } from "./main.ts";
import { services } from "./services.ts";
import { captureConsole, createMockServices, jsonResponse } from "./lib/test-helpers.ts";

describe("main", () => {
  let restoreConsole: (() => void) | undefined;
  const orig = { ...services };

  afterEach(() => {
    Object.assign(services, orig);
    restoreConsole?.();
    restoreConsole = undefined;
  });

  it("rejects --image with get command", async () => {
    await assertRejects(
      () => main(["get", "123", "--image", "photo.jpg"]),
      Error,
      "--image is not supported",
    );
  });

  it("rejects --image with delete command", async () => {
    await assertRejects(
      () => main(["delete", "123", "--image", "photo.jpg"]),
      Error,
      "--image is not supported",
    );
  });

  it("shorthand tweet posts via default branch", async () => {
    const mock = createMockServices({
      fetch: (url, init) => {
        if (url === "https://api.x.com/2/tweets") {
          const body = JSON.parse(init?.body as string);
          assertEquals(body.text, "Hello");
          return jsonResponse({ data: { id: "500" } });
        }
        return jsonResponse({}, 404);
      },
    });
    Object.assign(services, mock);

    const { output, restore: rc } = captureConsole();
    restoreConsole = rc;

    await main(["Hello"]);
    assertEquals(output.length, 1);
    assertEquals(output[0]!.includes("500"), true);
  });
});
