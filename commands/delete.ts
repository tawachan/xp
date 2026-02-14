import { deleteTweet } from "../lib/x-client.ts";
import { formatDeleteResult } from "../lib/output.ts";

export async function deleteCommand(tweetId: string): Promise<void> {
  if (!tweetId) {
    throw new Error("ツイートIDを指定してください");
  }
  await deleteTweet(tweetId);
  console.log(formatDeleteResult(tweetId));
}
