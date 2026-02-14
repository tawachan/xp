import { postTweet } from "../lib/x-client.ts";
import { formatTweetResult } from "../lib/output.ts";

export async function tweetCommand(text: string): Promise<void> {
  if (!text) {
    throw new Error("Text is required");
  }
  if (text.length > 280) {
    throw new Error(`Text is too long (${text.length}/280 characters)`);
  }
  const result = await postTweet(text);
  console.log(formatTweetResult(result));
}
