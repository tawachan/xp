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
  data: { id: string; text: string; created_at?: string },
  json = false,
): string {
  if (json) {
    const obj: Record<string, string> = { tweet_id: data.id, text: data.text };
    if (data.created_at) obj.created_at = data.created_at;
    obj.url = tweetUrl(data.id);
    return JSON.stringify(obj);
  }
  const lines = [
    `tweet_id: ${data.id}`,
    `text: ${data.text}`,
  ];
  if (data.created_at) {
    lines.push(`created_at: ${data.created_at}`);
  }
  lines.push(`url: ${tweetUrl(data.id)}`);
  return lines.join("\n");
}

export function formatTweetList(
  tweets: Array<{ id: string; text: string; created_at?: string }>,
  json = false,
): string {
  if (json) {
    return JSON.stringify(
      tweets.map((t) => {
        const obj: Record<string, string> = { tweet_id: t.id, text: t.text };
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
        `text: ${t.text}`,
      ];
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

export function formatError(message: string, json = false): string {
  if (json) {
    return JSON.stringify({ error: message });
  }
  return `error: ${message}`;
}
