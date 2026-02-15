import type { Services } from "../lib/services.ts";
import { postTweet, getTweet, getMyTweets, deleteTweet } from "../lib/x-client.ts";
import { uploadAllMedia } from "../lib/media-upload.ts";
import {
  formatTweetResult,
  formatThreadResult,
  formatTweetData,
  formatTweetList,
  formatDeleteResult,
} from "../lib/output.ts";

export interface MeOptions {
  limit?: string;
  beforeId?: string;
  afterId?: string;
  json?: boolean;
}

export class Commands {
  constructor(private services: Services) {}

  async tweet(text: string, json = false, imagePaths?: string[]): Promise<void> {
    if (!text) {
      throw new Error("Text is required");
    }
    if (text.length > 280) {
      throw new Error(`Text is too long (${text.length}/280 characters)`);
    }
    const mediaIds = imagePaths?.length ? await uploadAllMedia(this.services, imagePaths) : undefined;
    const result = await postTweet(this.services, text, undefined, mediaIds);
    await this.services.cacheTweet({ id: result.id, text, created_at: new Date().toISOString() });
    console.log(formatTweetResult(result, json));
  }

  async reply(tweetId: string, text: string, json = false, imagePaths?: string[]): Promise<void> {
    if (!text) {
      throw new Error("Text is required");
    }
    if (text.length > 280) {
      throw new Error(`Text is too long (${text.length}/280 characters)`);
    }
    const mediaIds = imagePaths?.length ? await uploadAllMedia(this.services, imagePaths) : undefined;
    const result = await postTweet(this.services, text, tweetId, mediaIds);
    await this.services.cacheTweet({ id: result.id, text, created_at: new Date().toISOString() });
    console.log(formatTweetResult(result, json));
  }

  async thread(texts: string[], json = false, imagePaths?: string[]): Promise<void> {
    if (texts.length < 2) {
      throw new Error("Thread requires at least 2 texts");
    }
    for (const [i, text] of texts.entries()) {
      if (text.length > 280) {
        throw new Error(`Text ${i + 1} is too long (${text.length}/280 characters)`);
      }
    }

    // Upload images for the first tweet only
    const mediaIds = imagePaths?.length ? await uploadAllMedia(this.services, imagePaths) : undefined;

    const results: Array<{ id: string }> = [];
    let previousId: string | undefined;
    const now = new Date().toISOString();

    for (let i = 0; i < texts.length; i++) {
      const result = await postTweet(this.services, texts[i]!, previousId, i === 0 ? mediaIds : undefined);
      results.push(result);
      await this.services.cacheTweet({ id: result.id, text: texts[i]!, created_at: now });
      previousId = result.id;
    }

    console.log(formatThreadResult(results, json));
  }

  async get(tweetId: string, json = false): Promise<void> {
    const cached = await this.services.getCachedTweet(tweetId);
    if (cached) {
      console.log(formatTweetData(cached, json));
      return;
    }
    const tweet = await getTweet(this.services, tweetId);
    await this.services.cacheTweet(tweet);
    console.log(formatTweetData(tweet, json));
  }

  async me(options: MeOptions = {}): Promise<void> {
    const { limit, beforeId, afterId, json = false } = options;
    const maxResults = limit ? parseInt(limit) : 10;
    if (isNaN(maxResults) || maxResults < 5 || maxResults > 100) {
      throw new Error("Limit must be between 5 and 100 (default: 10)");
    }
    const tweets = await getMyTweets(this.services, { maxResults, beforeId, afterId });
    await this.services.cacheTweets(tweets);
    console.log(formatTweetList(tweets, json));
  }

  async delete(tweetId: string, json = false): Promise<void> {
    if (!tweetId) {
      throw new Error("Tweet ID is required");
    }
    await deleteTweet(this.services, tweetId);
    await this.services.removeCachedTweet(tweetId);
    console.log(formatDeleteResult(tweetId, json));
  }
}
