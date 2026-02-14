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

export function formatDeleteResult(id: string): string {
  return `deleted: ${id}`;
}

export function formatError(message: string): string {
  return `error: ${message}`;
}
