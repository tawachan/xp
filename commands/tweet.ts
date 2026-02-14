import { postTweet } from "../lib/x-client.ts";
import { formatTweetResult } from "../lib/output.ts";

export async function tweetCommand(text: string): Promise<void> {
  if (!text) {
    throw new Error("テキストを指定してください");
  }
  if (text.length > 280) {
    throw new Error(`テキストが長すぎます (${text.length}/280文字)`);
  }
  const result = await postTweet(text);
  console.log(formatTweetResult(result));
}
