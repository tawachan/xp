import { postTweet, getMyUserId, validateTweetId } from "../lib/x-client.ts";
import { cacheTweet } from "../lib/cache-store.ts";
import { validateFile } from "../lib/media-upload.ts";
import { uploadAllMedia } from "../lib/media-upload.ts";
import {
  addSchedule,
  getSchedule,
  resolveScheduleId,
  listSchedules,
  getDueSchedules,
  updateScheduleStatus,
  removeSchedule,
  clearSchedules,
  acquireScheduleLock,
  releaseScheduleLock,
  type ScheduledTweet,
} from "../lib/schedule-store.ts";
import {
  formatScheduledTweet,
  formatScheduledTweetList,
  formatScheduleRemoveResult,
  formatScheduleRunResult,
  formatScheduleClearResult,
} from "../lib/output.ts";

function parseScheduledAt(at: string): string {
  // Accept ISO 8601 formats:
  // 2026-02-25T10:00
  // 2026-02-25T10:00:00+09:00
  // 2026-02-25T10:00:00Z
  const date = new Date(at);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid datetime: "${at}" (must be ISO 8601, e.g. 2026-02-25T10:00:00+09:00)`);
  }
  return date.toISOString();
}

export async function scheduleAddCommand(
  args: string[],
  at: string,
  json: boolean,
  imagePaths?: string[],
): Promise<void> {
  // Determine type from first arg
  let type: "tweet" | "thread" | "reply";
  let texts: string[];
  let replyToId: string | undefined;

  if (args[0] === "tweet") {
    type = "tweet";
    texts = args.slice(1);
    if (texts.length === 0) throw new Error("Text is required: xp schedule add tweet <text> --at <datetime>");
  } else if (args[0] === "thread") {
    type = "thread";
    texts = args.slice(1);
    if (texts.length < 2) throw new Error("Thread requires at least 2 texts");
  } else if (args[0] === "reply") {
    type = "reply";
    if (!args[1]) throw new Error("Tweet ID is required: xp schedule add reply <tweet_id> <text> --at <datetime>");
    if (!args[2]) throw new Error("Text is required: xp schedule add reply <tweet_id> <text> --at <datetime>");
    replyToId = args[1];
    validateTweetId(replyToId);
    texts = [args[2]];
  } else {
    // Implicit tweet
    type = "tweet";
    texts = args;
    if (texts.length === 0) throw new Error("Text is required: xp schedule add <text> --at <datetime>");
  }

  // Validate text lengths
  for (const [i, text] of texts.entries()) {
    if (text.length > 280) {
      const label = texts.length > 1 ? ` ${i + 1}` : "";
      throw new Error(`Text${label} is too long (${text.length}/280 characters)`);
    }
  }

  // Parse and validate scheduled time
  const scheduledAt = parseScheduledAt(at);
  if (new Date(scheduledAt) <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  // Validate and resolve image paths
  let resolvedImagePaths: string[] | undefined;
  if (imagePaths?.length) {
    for (const p of imagePaths) {
      await validateFile(p);
    }
    if (imagePaths.length > 4) {
      throw new Error(`Too many images (${imagePaths.length}/4 max)`);
    }
    resolvedImagePaths = [];
    for (const p of imagePaths) {
      resolvedImagePaths.push(await Deno.realPath(p));
    }
  }

  const schedule: ScheduledTweet = {
    id: crypto.randomUUID(),
    type,
    texts,
    replyToId,
    imagePaths: resolvedImagePaths,
    scheduledAt,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  await addSchedule(schedule);
  console.log(formatScheduledTweet(schedule, json));
}

export async function scheduleListCommand(options: { status?: string; json: boolean }): Promise<void> {
  if (options.status && !["pending", "posted", "failed"].includes(options.status)) {
    throw new Error(`Invalid status: "${options.status}" (must be pending, posted, or failed)`);
  }
  const schedules = await listSchedules(options.status);
  console.log(formatScheduledTweetList(schedules, options.json));
}

export async function scheduleShowCommand(idOrPrefix: string, json: boolean): Promise<void> {
  const id = await resolveScheduleId(idOrPrefix);
  const schedule = await getSchedule(id);
  if (!schedule) throw new Error(`Schedule not found: ${id}`);
  console.log(formatScheduledTweet(schedule, json));
}

export async function scheduleRemoveCommand(idOrPrefix: string, json: boolean): Promise<void> {
  const id = await resolveScheduleId(idOrPrefix);
  await removeSchedule(id);
  console.log(formatScheduleRemoveResult(id, json));
}

export async function scheduleClearCommand(all: boolean, json: boolean): Promise<void> {
  const count = await clearSchedules(all);
  console.log(formatScheduleClearResult(count, json));
}

export async function scheduleRunCommand(json: boolean): Promise<void> {
  await acquireScheduleLock();
  try {
    await _scheduleRunInner(json);
  } finally {
    await releaseScheduleLock();
  }
}

async function _scheduleRunInner(json: boolean): Promise<void> {
  const due = await getDueSchedules();
  if (due.length === 0) {
    if (json) {
      console.log(JSON.stringify({ posted: 0, failed: 0, results: [] }));
    } else {
      console.log("No due schedules");
    }
    return;
  }

  const results: Array<{ id: string; status: "posted" | "failed"; tweetIds?: string[]; error?: string }> = [];
  let hasFailed = false;

  for (const schedule of due) {
    try {
      const tweetIds: string[] = [];

      if (schedule.type === "tweet") {
        const mediaIds = schedule.imagePaths?.length ? await uploadAllMedia(schedule.imagePaths) : undefined;
        const result = await postTweet(schedule.texts[0]!, undefined, mediaIds);
        tweetIds.push(result.id);

        let authorId: string | undefined;
        try { authorId = await getMyUserId(); } catch { /* best-effort */ }
        await cacheTweet({ id: result.id, text: schedule.texts[0]!, created_at: new Date().toISOString(), author_id: authorId });
      } else if (schedule.type === "thread") {
        const mediaIds = schedule.imagePaths?.length ? await uploadAllMedia(schedule.imagePaths) : undefined;
        let authorId: string | undefined;
        try { authorId = await getMyUserId(); } catch { /* best-effort */ }

        let previousId: string | undefined;
        const now = new Date().toISOString();
        for (let i = 0; i < schedule.texts.length; i++) {
          const result = await postTweet(schedule.texts[i]!, previousId, i === 0 ? mediaIds : undefined);
          tweetIds.push(result.id);
          await cacheTweet({ id: result.id, text: schedule.texts[i]!, created_at: now, author_id: authorId });
          previousId = result.id;
        }
      } else if (schedule.type === "reply") {
        const mediaIds = schedule.imagePaths?.length ? await uploadAllMedia(schedule.imagePaths) : undefined;
        const result = await postTweet(schedule.texts[0]!, schedule.replyToId, mediaIds);
        tweetIds.push(result.id);

        let authorId: string | undefined;
        try { authorId = await getMyUserId(); } catch { /* best-effort */ }
        await cacheTweet({ id: result.id, text: schedule.texts[0]!, created_at: new Date().toISOString(), author_id: authorId });
      }

      await updateScheduleStatus(schedule.id, "posted", {
        tweetIds,
        postedAt: new Date().toISOString(),
      });
      results.push({ id: schedule.id, status: "posted", tweetIds });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      await updateScheduleStatus(schedule.id, "failed", undefined, errorMsg);
      results.push({ id: schedule.id, status: "failed", error: errorMsg });
      hasFailed = true;
    }
  }

  const posted = results.filter((r) => r.status === "posted").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(formatScheduleRunResult({ posted, failed, results }, json));

  if (hasFailed) {
    Deno.exit(1);
  }
}
