export function formatTweetResult(data: { id: string }): string {
  return [
    `tweet_id: ${data.id}`,
    `url: https://x.com/i/status/${data.id}`,
  ].join("\n");
}

export function formatThreadResult(results: Array<{ id: string }>): string {
  return results
    .map((r, i) => {
      return [
        `[${i + 1}/${results.length}]`,
        `tweet_id: ${r.id}`,
        `url: https://x.com/i/status/${r.id}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function formatTweetData(data: {
  id: string;
  text: string;
  created_at?: string;
}): string {
  const lines = [
    `tweet_id: ${data.id}`,
    `text: ${data.text}`,
  ];
  if (data.created_at) {
    lines.push(`created_at: ${data.created_at}`);
  }
  lines.push(`url: https://x.com/i/status/${data.id}`);
  return lines.join("\n");
}

export function formatTweetList(
  tweets: Array<{ id: string; text: string; created_at?: string }>,
): string {
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
      lines.push(`url: https://x.com/i/status/${t.id}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatDeleteResult(id: string): string {
  return `deleted: ${id}`;
}

export function formatError(message: string): string {
  return `error: ${message}`;
}
