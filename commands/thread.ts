import { postTweet } from "../lib/x-client.ts";
import { cacheTweet } from "../lib/cache-store.ts";
import { formatThreadResult } from "../lib/output.ts";

export async function threadCommand(texts: string[], json = false): Promise<void> {
  if (texts.length < 2) {
    throw new Error("Thread requires at least 2 texts");
  }
  for (const [i, text] of texts.entries()) {
    if (text.length > 280) {
      throw new Error(`Text ${i + 1} is too long (${text.length}/280 characters)`);
    }
  }

  const results: Array<{ id: string }> = [];
  let previousId: string | undefined;
  const now = new Date().toISOString();

  for (const text of texts) {
    const result = await postTweet(text, previousId);
    results.push(result);
    await cacheTweet({ id: result.id, text, created_at: now });
    previousId = result.id;
  }

  console.log(formatThreadResult(results, json));
}
