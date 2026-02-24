function tweetUrl(id: string): string {
  return `https://x.com/i/status/${id}`;
}

export function formatTweetResult(data: { id: string }, json = false): string {
  if (json) {
    return JSON.stringify({ tweet_id: data.id, url: tweetUrl(data.id) });
  }
  return [
    `tweet_id: ${data.id}`,
    `url: ${tweetUrl(data.id)}`,
  ].join("\n");
}

export function formatThreadResult(results: Array<{ id: string }>, json = false): string {
  if (json) {
    return JSON.stringify(
      results.map((r) => ({ tweet_id: r.id, url: tweetUrl(r.id) })),
    );
  }
  return results
    .map((r, i) => {
      return [
        `[${i + 1}/${results.length}]`,
        `tweet_id: ${r.id}`,
        `url: ${tweetUrl(r.id)}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function formatTweetData(
  data: { id: string; text: string; created_at?: string; author_id?: string; author_username?: string },
  json = false,
): string {
  if (json) {
    const obj: Record<string, string> = { tweet_id: data.id };
    if (data.author_id) obj.author_id = data.author_id;
    if (data.author_username) obj.author_username = data.author_username;
    obj.text = data.text;
    if (data.created_at) obj.created_at = data.created_at;
    obj.url = tweetUrl(data.id);
    return JSON.stringify(obj);
  }
  const lines = [
    `tweet_id: ${data.id}`,
  ];
  if (data.author_id) {
    lines.push(`author_id: ${data.author_id}`);
  }
  if (data.author_username) {
    lines.push(`author_username: ${data.author_username}`);
  }
  lines.push(`text: ${data.text}`);
  if (data.created_at) {
    lines.push(`created_at: ${data.created_at}`);
  }
  lines.push(`url: ${tweetUrl(data.id)}`);
  return lines.join("\n");
}

export function formatTweetList(
  tweets: Array<{ id: string; text: string; created_at?: string; author_id?: string; author_username?: string }>,
  json = false,
): string {
  if (json) {
    return JSON.stringify(
      tweets.map((t) => {
        const obj: Record<string, string> = { tweet_id: t.id };
        if (t.author_id) obj.author_id = t.author_id;
        if (t.author_username) obj.author_username = t.author_username;
        obj.text = t.text;
        if (t.created_at) obj.created_at = t.created_at;
        obj.url = tweetUrl(t.id);
        return obj;
      }),
    );
  }
  if (tweets.length === 0) {
    return "No tweets found";
  }
  return tweets
    .map((t, i) => {
      const lines = [
        `[${i + 1}/${tweets.length}]`,
        `tweet_id: ${t.id}`,
      ];
      if (t.author_id) {
        lines.push(`author_id: ${t.author_id}`);
      }
      if (t.author_username) {
        lines.push(`author_username: ${t.author_username}`);
      }
      lines.push(`text: ${t.text}`);
      if (t.created_at) {
        lines.push(`created_at: ${t.created_at}`);
      }
      lines.push(`url: ${tweetUrl(t.id)}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatDeleteResult(id: string, json = false): string {
  if (json) {
    return JSON.stringify({ deleted: id });
  }
  return `deleted: ${id}`;
}

export interface ScheduledTweetOutput {
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

export function formatScheduledTweet(s: ScheduledTweetOutput, json = false): string {
  if (json) {
    const obj: Record<string, unknown> = {
      id: s.id,
      type: s.type,
      texts: s.texts,
      scheduled_at: s.scheduledAt,
      created_at: s.createdAt,
      status: s.status,
    };
    if (s.replyToId) obj.reply_to_id = s.replyToId;
    if (s.imagePaths?.length) obj.image_paths = s.imagePaths;
    if (s.result) obj.result = { tweet_ids: s.result.tweetIds, posted_at: s.result.postedAt };
    if (s.error) obj.error = s.error;
    return JSON.stringify(obj);
  }
  const lines = [
    `id: ${s.id}`,
    `type: ${s.type}`,
  ];
  if (s.type === "reply" && s.replyToId) {
    lines.push(`reply_to_id: ${s.replyToId}`);
  }
  for (const [i, text] of s.texts.entries()) {
    lines.push(s.texts.length > 1 ? `text[${i + 1}]: ${text}` : `text: ${text}`);
  }
  if (s.imagePaths?.length) {
    for (const p of s.imagePaths) {
      lines.push(`image: ${p}`);
    }
  }
  lines.push(`scheduled_at: ${s.scheduledAt}`);
  lines.push(`created_at: ${s.createdAt}`);
  lines.push(`status: ${s.status}`);
  if (s.result) {
    lines.push(`tweet_ids: ${s.result.tweetIds.join(", ")}`);
    lines.push(`posted_at: ${s.result.postedAt}`);
  }
  if (s.error) {
    lines.push(`error: ${s.error}`);
  }
  return lines.join("\n");
}

export function formatScheduledTweetList(list: ScheduledTweetOutput[], json = false): string {
  if (json) {
    return JSON.stringify(list.map((s) => {
      const obj: Record<string, unknown> = {
        id: s.id,
        type: s.type,
        texts: s.texts,
        scheduled_at: s.scheduledAt,
        created_at: s.createdAt,
        status: s.status,
      };
      if (s.replyToId) obj.reply_to_id = s.replyToId;
      if (s.imagePaths?.length) obj.image_paths = s.imagePaths;
      if (s.result) obj.result = { tweet_ids: s.result.tweetIds, posted_at: s.result.postedAt };
      if (s.error) obj.error = s.error;
      return obj;
    }));
  }
  if (list.length === 0) {
    return "No scheduled tweets found";
  }
  return list
    .map((s, i) => `[${i + 1}/${list.length}]\n${formatScheduledTweet(s)}`)
    .join("\n\n");
}

export function formatScheduleRemoveResult(id: string, json = false): string {
  if (json) {
    return JSON.stringify({ removed: id });
  }
  return `removed: ${id}`;
}

export interface ScheduleRunResultOutput {
  posted: number;
  failed: number;
  results: Array<{ id: string; status: "posted" | "failed"; tweetIds?: string[]; error?: string }>;
}

export function formatScheduleRunResult(result: ScheduleRunResultOutput, json = false): string {
  if (json) {
    return JSON.stringify({
      posted: result.posted,
      failed: result.failed,
      results: result.results.map((r) => {
        const obj: Record<string, unknown> = { id: r.id, status: r.status };
        if (r.tweetIds) obj.tweet_ids = r.tweetIds;
        if (r.error) obj.error = r.error;
        return obj;
      }),
    });
  }
  const lines: string[] = [];
  for (const r of result.results) {
    if (r.status === "posted") {
      lines.push(`posted: ${r.id} -> ${r.tweetIds?.join(", ") ?? ""}`);
    } else {
      lines.push(`failed: ${r.id} -> ${r.error}`);
    }
  }
  lines.push(`\ntotal: ${result.posted} posted, ${result.failed} failed`);
  return lines.join("\n");
}

export function formatScheduleClearResult(count: number, json = false): string {
  if (json) {
    return JSON.stringify({ cleared: count });
  }
  return `cleared: ${count} schedule(s)`;
}

export function formatError(message: string, json = false): string {
  if (json) {
    return JSON.stringify({ error: message });
  }
  return `error: ${message}`;
}
