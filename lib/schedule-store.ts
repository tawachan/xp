import { loadPartialConfig } from "./config-store.ts";

export interface ScheduledTweet {
  id: string;
  type: "tweet" | "thread" | "reply";
  texts: string[];
  replyToId?: string;
  imagePaths?: string[];
  scheduledAt: string;
  createdAt: string;
  status: "pending" | "posted" | "failed";
  result?: { tweetIds: string[]; postedAt: string };
  error?: string;
}

function expandHome(path: string): string {
  if (path.startsWith("~")) {
    const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
    return home + path.slice(1);
  }
  return path;
}

function defaultScheduleDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
  return `${home}/.config/xp/schedule`;
}

async function getScheduleDir(): Promise<string> {
  const config = await loadPartialConfig();
  if (config.scheduleDir) {
    return expandHome(config.scheduleDir);
  }
  return defaultScheduleDir();
}

async function getSchedulePath(): Promise<string> {
  const dir = await getScheduleDir();
  return `${dir}/schedules.json`;
}

async function loadSchedules(): Promise<ScheduledTweet[]> {
  const path = await getSchedulePath();
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as ScheduledTweet[];
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return [];
    }
    throw new Error(
      `Failed to load schedules from "${path}": ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

async function saveSchedules(schedules: ScheduledTweet[]): Promise<void> {
  const dir = await getScheduleDir();
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(await getSchedulePath(), JSON.stringify(schedules, null, 2));
}

export async function acquireScheduleLock(): Promise<void> {
  const dir = await getScheduleDir();
  await Deno.mkdir(dir, { recursive: true });
  const lockPath = `${dir}/schedules.lock`;
  try {
    const file = await Deno.open(lockPath, { write: true, createNew: true });
    file.close();
  } catch (e) {
    if (e instanceof Deno.errors.AlreadyExists) {
      throw new Error("Another xp schedule process is running. If this is a stale lock, remove " + lockPath);
    }
    throw e;
  }
}

export async function releaseScheduleLock(): Promise<void> {
  const dir = await getScheduleDir();
  const lockPath = `${dir}/schedules.lock`;
  try {
    await Deno.remove(lockPath);
  } catch {
    // best-effort cleanup
  }
}

export async function addSchedule(schedule: ScheduledTweet): Promise<void> {
  const schedules = await loadSchedules();
  schedules.push(schedule);
  await saveSchedules(schedules);
}

export async function getSchedule(id: string): Promise<ScheduledTweet | null> {
  const schedules = await loadSchedules();
  return schedules.find((s) => s.id === id) ?? null;
}

export async function resolveScheduleId(idOrPrefix: string): Promise<string> {
  const schedules = await loadSchedules();
  const exact = schedules.find((s) => s.id === idOrPrefix);
  if (exact) return exact.id;

  const matches = schedules.filter((s) => s.id.startsWith(idOrPrefix));
  if (matches.length === 1) return matches[0]!.id;
  if (matches.length === 0) throw new Error(`Schedule not found: ${idOrPrefix}`);
  throw new Error(`Ambiguous ID prefix "${idOrPrefix}" — matches ${matches.length} schedules. Use more characters.`);
}

export async function listSchedules(status?: string): Promise<ScheduledTweet[]> {
  const schedules = await loadSchedules();
  const filtered = status ? schedules.filter((s) => s.status === status) : schedules;
  return filtered.sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : a.scheduledAt > b.scheduledAt ? 1 : 0));
}

export async function getDueSchedules(): Promise<ScheduledTweet[]> {
  const schedules = await loadSchedules();
  const now = new Date().toISOString();
  return schedules
    .filter((s) => s.status === "pending" && s.scheduledAt <= now)
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : a.scheduledAt > b.scheduledAt ? 1 : 0));
}

export async function updateScheduleStatus(
  id: string,
  status: "posted" | "failed",
  result?: { tweetIds: string[]; postedAt: string },
  error?: string,
): Promise<void> {
  const schedules = await loadSchedules();
  const schedule = schedules.find((s) => s.id === id);
  if (!schedule) throw new Error(`Schedule not found: ${id}`);
  schedule.status = status;
  if (result) schedule.result = result;
  if (error) schedule.error = error;
  await saveSchedules(schedules);
}

export async function removeSchedule(id: string): Promise<void> {
  const schedules = await loadSchedules();
  const index = schedules.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Schedule not found: ${id}`);
  schedules.splice(index, 1);
  await saveSchedules(schedules);
}

export async function clearSchedules(all?: boolean): Promise<number> {
  const schedules = await loadSchedules();
  if (all) {
    const count = schedules.length;
    await saveSchedules([]);
    return count;
  }
  const remaining = schedules.filter((s) => s.status === "pending");
  const removed = schedules.length - remaining.length;
  await saveSchedules(remaining);
  return removed;
}
