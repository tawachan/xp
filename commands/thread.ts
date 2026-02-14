import { postTweet } from "../lib/x-client.ts";
import { formatThreadResult } from "../lib/output.ts";

export async function threadCommand(texts: string[]): Promise<void> {
  if (texts.length < 2) {
    throw new Error("スレッドには2つ以上のテキストが必要です");
  }
  for (const [i, text] of texts.entries()) {
    if (text.length > 280) {
      throw new Error(`テキスト ${i + 1} が長すぎます (${text.length}/280文字)`);
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
