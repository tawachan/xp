import { getTweet } from "../lib/x-client.ts";
import { formatTweetData } from "../lib/output.ts";

export async function getCommand(tweetId: string, json = false): Promise<void> {
  const tweet = await getTweet(tweetId);
  console.log(formatTweetData(tweet, json));
}
