import { buildAuthHeader } from "./oauth.ts";
import { loadConfig } from "./config-store.ts";

const BASE_URL = "https://api.x.com/2";

export function validateTweetId(tweetId: string): void {
  if (!/^\d+$/.test(tweetId)) {
    throw new Error(`Invalid tweet ID: "${tweetId}" (must be a numeric ID)`);
  }
}

export async function postTweet(
  text: string,
  replyToId?: string,
  mediaIds?: string[],
): Promise<{ id: string }> {
  if (replyToId) {
    validateTweetId(replyToId);
  }
  const config = await loadConfig();
  const url = `${BASE_URL}/tweets`;

  const body: Record<string, unknown> = { text };
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId };
  }
  if (mediaIds && mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
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

export interface TweetData {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  author_username?: string;
}

export async function getTweet(tweetId: string): Promise<TweetData> {
  validateTweetId(tweetId);
  const config = await loadConfig();
  const url = `${BASE_URL}/tweets/${tweetId}`;
  const params = { "tweet.fields": "created_at,author_id" };

  const authHeader = await buildAuthHeader("GET", url, config, params);

  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${queryString}`, {
    method: "GET",
    headers: { Authorization: authHeader },
  });

  await handleApiError(res, "read");
  const json = await res.json();
  if (!json.data) {
    throw new Error(`Tweet not found: ${tweetId}`);
  }
  return json.data;
}

export interface GetMyTweetsOptions {
  maxResults?: number;
  beforeId?: string;
  afterId?: string;
}

export async function getMyUserId(): Promise<string> {
  const config = await loadConfig();
  const meUrl = `${BASE_URL}/users/me`;
  const meAuthHeader = await buildAuthHeader("GET", meUrl, config);
  const meRes = await fetch(meUrl, {
    method: "GET",
    headers: { Authorization: meAuthHeader },
  });
  await handleApiError(meRes, "read");
  const meJson = await meRes.json();
  if (!meJson.data) {
    throw new Error("Failed to retrieve authenticated user");
  }
  return meJson.data.id;
}

export async function getMyTweets(options: GetMyTweetsOptions = {}): Promise<TweetData[]> {
  const { maxResults = 10, beforeId, afterId } = options;
  if (beforeId) validateTweetId(beforeId);
  if (afterId) validateTweetId(afterId);

  const userId = await getMyUserId();
  const config = await loadConfig();

  // Get their tweets, paginating if the API returns fewer than requested
  const tweetsUrl = `${BASE_URL}/users/${userId}/tweets`;
  const allTweets: TweetData[] = [];
  let remaining = maxResults;
  let paginationToken: string | undefined;

  while (remaining > 0) {
    // API minimum is 5, so request at least 5 and trim later
    const perPage = Math.max(Math.min(remaining, 100), 5);
    const params: Record<string, string> = {
      "max_results": perPage.toString(),
      "tweet.fields": "created_at,author_id",
    };
    if (beforeId) params["until_id"] = beforeId;
    if (afterId) params["since_id"] = afterId;
    if (paginationToken) params["pagination_token"] = paginationToken;

    const tweetsAuthHeader = await buildAuthHeader("GET", tweetsUrl, config, params);
    const queryString = new URLSearchParams(params).toString();
    const tweetsRes = await fetch(`${tweetsUrl}?${queryString}`, {
      method: "GET",
      headers: { Authorization: tweetsAuthHeader },
    });

    await handleApiError(tweetsRes, "read");
    const tweetsJson = await tweetsRes.json();
    const tweets: TweetData[] = tweetsJson.data ?? [];
    allTweets.push(...tweets);
    remaining -= tweets.length;

    const nextToken = tweetsJson.meta?.next_token;
    if (!nextToken || tweets.length === 0) break;
    paginationToken = nextToken;
  }

  return allTweets.slice(0, maxResults);
}

export async function getMyMentions(options: GetMyTweetsOptions = {}): Promise<TweetData[]> {
  const { maxResults = 10, beforeId, afterId } = options;
  if (beforeId) validateTweetId(beforeId);
  if (afterId) validateTweetId(afterId);

  const userId = await getMyUserId();
  const config = await loadConfig();

  const mentionsUrl = `${BASE_URL}/users/${userId}/mentions`;
  const allTweets: TweetData[] = [];
  let remaining = maxResults;
  let paginationToken: string | undefined;

  while (remaining > 0) {
    const perPage = Math.max(Math.min(remaining, 100), 5);
    const params: Record<string, string> = {
      "max_results": perPage.toString(),
      "tweet.fields": "created_at,author_id",
      "expansions": "author_id",
      "user.fields": "username",
    };
    if (beforeId) params["until_id"] = beforeId;
    if (afterId) params["since_id"] = afterId;
    if (paginationToken) params["pagination_token"] = paginationToken;

    const authHeader = await buildAuthHeader("GET", mentionsUrl, config, params);
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${mentionsUrl}?${queryString}`, {
      method: "GET",
      headers: { Authorization: authHeader },
    });

    await handleApiError(res, "read");
    const json = await res.json();
    const tweets: TweetData[] = json.data ?? [];

    // Build author_id -> username map from includes.users
    const userMap = new Map<string, string>();
    if (json.includes?.users) {
      for (const user of json.includes.users) {
        userMap.set(user.id, user.username);
      }
    }
    for (const tweet of tweets) {
      if (tweet.author_id && userMap.has(tweet.author_id)) {
        tweet.author_username = userMap.get(tweet.author_id);
      }
    }

    allTweets.push(...tweets);
    remaining -= tweets.length;

    const nextToken = json.meta?.next_token;
    if (!nextToken || tweets.length === 0) break;
    paginationToken = nextToken;
  }

  return allTweets.slice(0, maxResults);
}

export async function deleteTweet(tweetId: string): Promise<void> {
  validateTweetId(tweetId);
  const config = await loadConfig();
  const url = `${BASE_URL}/tweets/${tweetId}`;

  const authHeader = await buildAuthHeader("DELETE", url, config);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
  });

  await handleApiError(res, "write");
}

export async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.text();
    const json = JSON.parse(body);
    // X API v2 error format: { detail: "...", title: "...", ... }
    if (json.detail) return json.detail;
    // Alternative format: { errors: [{ message: "..." }] }
    if (json.errors?.[0]?.message) return json.errors[0].message;
    return body;
  } catch {
    return "Unknown error";
  }
}

async function handleApiError(
  res: Response,
  operation: "read" | "write" = "write",
): Promise<void> {
  if (res.ok) return;

  if (res.status === 400) {
    const detail = await parseErrorDetail(res);
    throw new Error(`Bad request: ${detail}`);
  }
  if (res.status === 401) {
    throw new Error("Authentication failed. Run `xp auth login` to reconfigure");
  }
  if (res.status === 403) {
    if (operation === "read") {
      throw new Error(
        "This feature requires a paid X API plan (Pay-Per-Use or Basic).\n" +
          "Sign up at: https://developer.x.com/en/portal/products",
      );
    }
    throw new Error(
      "Permission denied. Ensure your app has Read and Write access in the Developer Portal",
    );
  }
  if (res.status === 404) {
    throw new Error("Not found. The tweet may have been deleted or the ID is invalid");
  }
  if (res.status === 429) {
    const resetTime = res.headers.get("x-rate-limit-reset");
    const resetDate = resetTime
      ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString()
      : "unknown";
    throw new Error(`Rate limit exceeded. Resets at ${resetDate}`);
  }

  const detail = await parseErrorDetail(res);
  throw new Error(`API error (${res.status}): ${detail}`);
}
