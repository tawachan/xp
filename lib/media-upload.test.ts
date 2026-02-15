import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { uploadAllMedia } from "./media-upload.ts";
import { createMockServices, jsonResponse } from "./test-helpers.ts";

describe("uploadAllMedia", () => {
  it("uploads a single image", async () => {
    let uploadCalled = false;
    const svc = createMockServices({
      files: new Map([
        ["photo.jpg", { size: 1024, data: new Uint8Array(1024) }],
      ]),
      fetch: (url) => {
        assertEquals(url, "https://api.x.com/2/media/upload");
        uploadCalled = true;
        return jsonResponse({ data: { id: "media_1" } });
      },
    });

    const ids = await uploadAllMedia(svc, ["photo.jpg"]);
    assertEquals(ids, ["media_1"]);
    assertEquals(uploadCalled, true);
  });

  it("uploads multiple images", async () => {
    let callCount = 0;
    const svc = createMockServices({
      files: new Map([
        ["a.png", { size: 512, data: new Uint8Array(512) }],
        ["b.jpg", { size: 1024, data: new Uint8Array(1024) }],
        ["c.gif", { size: 256, data: new Uint8Array(256) }],
      ]),
      fetch: () => {
        callCount++;
        return jsonResponse({ data: { id: `media_${callCount}` } });
      },
    });

    const ids = await uploadAllMedia(svc, ["a.png", "b.jpg", "c.gif"]);
    assertEquals(ids, ["media_1", "media_2", "media_3"]);
    assertEquals(callCount, 3);
  });

  it("rejects more than 4 images", async () => {
    const svc = createMockServices();

    await assertRejects(
      () =>
        uploadAllMedia(svc, [
          "1.jpg",
          "2.jpg",
          "3.jpg",
          "4.jpg",
          "5.jpg",
        ]),
      Error,
      "Too many images",
    );
  });

  it("rejects missing file", async () => {
    const svc = createMockServices({
      files: new Map(),
    });

    await assertRejects(
      () => uploadAllMedia(svc, ["missing.jpg"]),
      Error,
      "File not found",
    );
  });

  it("rejects file larger than 5MB", async () => {
    const largeSize = 6 * 1024 * 1024;
    const svc = createMockServices({
      files: new Map([
        ["big.png", { size: largeSize, data: new Uint8Array(0) }],
      ]),
    });

    await assertRejects(
      () => uploadAllMedia(svc, ["big.png"]),
      Error,
      "File too large",
    );
  });

  it("rejects unsupported format", async () => {
    const svc = createMockServices({
      files: new Map([
        ["file.bmp", { size: 1024, data: new Uint8Array(1024) }],
      ]),
    });

    await assertRejects(
      () => uploadAllMedia(svc, ["file.bmp"]),
      Error,
      "Unsupported image format",
    );
  });

  it("throws on API error during upload", async () => {
    const svc = createMockServices({
      files: new Map([
        ["photo.jpg", { size: 1024, data: new Uint8Array(1024) }],
      ]),
      fetch: () => jsonResponse({ detail: "Upload failed" }, 500),
    });

    await assertRejects(
      () => uploadAllMedia(svc, ["photo.jpg"]),
      Error,
      "Media upload failed",
    );
  });
});
