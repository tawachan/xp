import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { uploadAllMedia } from "./media-upload.ts";
import { createMockServices, jsonResponse } from "./test-helpers.ts";

Deno.test("uploadAllMedia — uploads single file and returns media ID", async () => {
  let capturedUrl = "";
  const svc = createMockServices({
    fetch: async (input: string | URL | Request) => {
      capturedUrl = input.toString();
      return jsonResponse({ data: { id: "media_1" } });
    },
  });

  const result = await uploadAllMedia(svc, ["photo.jpg"]);
  assertEquals(result, ["media_1"]);
  assertEquals(capturedUrl, "https://api.x.com/2/media/upload");
});

Deno.test("uploadAllMedia — uploads multiple files", async () => {
  let callCount = 0;
  const svc = createMockServices({
    fetch: async () => {
      callCount++;
      return jsonResponse({ data: { id: `media_${callCount}` } });
    },
  });

  const result = await uploadAllMedia(svc, ["a.jpg", "b.png"]);
  assertEquals(result, ["media_1", "media_2"]);
  assertEquals(callCount, 2);
});

Deno.test("uploadAllMedia — rejects more than 4 images", async () => {
  const svc = createMockServices();
  await assertRejects(
    () => uploadAllMedia(svc, ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]),
    Error,
    "Too many images (5/4 max)",
  );
});

Deno.test("uploadAllMedia — rejects unsupported format", async () => {
  const svc = createMockServices();
  await assertRejects(
    () => uploadAllMedia(svc, ["photo.bmp"]),
    Error,
    "Unsupported image format",
  );
});

Deno.test("uploadAllMedia — rejects file not found", async () => {
  const svc = createMockServices({
    stat: () => Promise.reject(new Deno.errors.NotFound("not found")),
  });

  await assertRejects(
    () => uploadAllMedia(svc, ["missing.jpg"]),
    Error,
    "File not found: missing.jpg",
  );
});

Deno.test("uploadAllMedia — rejects file too large", async () => {
  const svc = createMockServices({
    stat: () => Promise.resolve({
      size: 6 * 1024 * 1024,
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    } as Deno.FileInfo),
  });

  await assertRejects(
    () => uploadAllMedia(svc, ["large.jpg"]),
    Error,
    "File too large",
  );
});

Deno.test("uploadAllMedia — validates all files before uploading", async () => {
  let fetchCalled = false;
  const svc = createMockServices({
    stat: (path: string | URL) => {
      if (path.toString() === "bad.bmp") {
        return Promise.resolve({ size: 100, isFile: true, isDirectory: false, isSymlink: false } as Deno.FileInfo);
      }
      return Promise.resolve({ size: 100, isFile: true, isDirectory: false, isSymlink: false } as Deno.FileInfo);
    },
    fetch: async () => {
      fetchCalled = true;
      return jsonResponse({ data: { id: "media_1" } });
    },
  });

  await assertRejects(
    () => uploadAllMedia(svc, ["good.jpg", "bad.bmp"]),
    Error,
    "Unsupported image format",
  );
  assertEquals(fetchCalled, false);
});

Deno.test("uploadAllMedia — handles upload failure", async () => {
  const svc = createMockServices({
    fetch: async () => jsonResponse({ detail: "Upload failed" }, 500),
  });

  await assertRejects(
    () => uploadAllMedia(svc, ["photo.jpg"]),
    Error,
    "Media upload failed",
  );
});
