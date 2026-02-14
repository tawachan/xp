import { postTweet } from "../lib/x-client.ts";
import { formatThreadResult } from "../lib/output.ts";

export async function threadCommand(texts: string[]): Promise<void> {
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

  for (const text of texts) {
    const result = await postTweet(text, previousId);
    results.push(result);
    previousId = result.id;
  }

  console.log(formatThreadResult(results));
}
