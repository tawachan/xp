import { buildAuthHeader } from "./oauth.ts";
import { loadConfig } from "./config-store.ts";

const BASE_URL = "https://api.x.com/2";

export async function postTweet(
  text: string,
  replyToId?: string,
): Promise<{ id: string }> {
  const config = await loadConfig();
  const url = `${BASE_URL}/tweets`;

  const body: Record<string, unknown> = { text };
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId };
  }

  const authHeader = await buildAuthHeader("POST", url, config);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleApiError(res);
  const json = await res.json();
  return { id: json.data.id };
}

export async function deleteTweet(tweetId: string): Promise<void> {
  const config = await loadConfig();
  const url = `${BASE_URL}/tweets/${tweetId}`;

  const authHeader = await buildAuthHeader("DELETE", url, config);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
  });

  await handleApiError(res);
}

async function handleApiError(res: Response): Promise<void> {
  if (res.ok) return;

  if (res.status === 401) {
    throw new Error("Authentication failed. Run `xp auth login` to reconfigure");
  }
  if (res.status === 403) {
    throw new Error(
      "Permission denied. Ensure your app has Read and Write access in the Developer Portal",
    );
  }
  if (res.status === 429) {
    const resetTime = res.headers.get("x-rate-limit-reset");
    const resetDate = resetTime
      ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString()
      : "unknown";
    throw new Error(`Rate limit exceeded. Resets at ${resetDate}`);
  }

  const body = await res.text();
  throw new Error(`API error (${res.status}): ${body}`);
}
