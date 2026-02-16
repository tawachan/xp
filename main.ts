import { tweetCommand } from "./commands/tweet.ts";
import { threadCommand } from "./commands/thread.ts";
import { deleteCommand } from "./commands/delete.ts";
import { getCommand } from "./commands/get.ts";
import { meCommand } from "./commands/me.ts";
import { replyCommand } from "./commands/reply.ts";
import { configSetCommand, configShowCommand, configUnsetCommand } from "./commands/config.ts";
import { authLoginCommand, authLogoutCommand } from "./commands/auth.ts";
import { completionsCommand } from "./commands/completions.ts";
import { upgradeCommand } from "./commands/upgrade.ts";
import { cacheListCommand, cacheShowCommand, cacheClearCommand } from "./commands/cache.ts";
import { formatError } from "./lib/output.ts";
import denoConfig from "./deno.json" with { type: "json" };

const VERSION = denoConfig.version;

const HELP = `xp - X (Twitter) CLI Tool v${VERSION}

Usage:
  xp <text>                          Post a tweet
  xp tweet <text>                    Post a tweet
  xp thread <text1> <text2> ...      Post a thread
  xp reply <tweet_id> <text>         Reply to a tweet
  xp get <tweet_id>                  Fetch a tweet by ID
  xp me [--limit N]                   List your recent tweets (default: 10)
  xp me --before <tweet_id>          Fetch tweets older than the given ID
  xp me --after <tweet_id>           Fetch tweets newer than the given ID
  xp delete <tweet_id>               Delete a tweet
  xp cache list [flags]              List cached tweets
  xp cache show <tweet_id>           Show a cached tweet
  xp cache clear                     Clear all cached tweets
  xp auth login                      Authenticate via browser (OAuth PIN flow)
  xp auth logout                     Remove saved credentials
  xp config set [flags]              Set API credentials
  xp config unset [flags]            Unset config values
  xp config show                     Show current config
  xp upgrade                         Upgrade to the latest version
  xp completions <shell>             Generate shell completions (fish/bash/zsh)
  xp help                            Show this help
  xp version                         Show version

Flags:
  --json                             Output in JSON format
  --image <path>                     Attach image (max 4, JPG/PNG/GIF/WebP, 5MB each)

Cache list flags:
  --limit N                          Show first N cached tweets
  --year YYYY                        Filter by year (e.g. 2026)
  --month M                          Filter by month (1-12, requires --year)

Config flags (for config set):
  --api-key=VALUE
  --api-secret=VALUE
  --access-token=VALUE
  --access-token-secret=VALUE
  --cache-dir=PATH                   Custom cache directory

Setup:
  xp auth login

Note:
  The "get" and "me" commands require a paid plan (Pay-Per-Use or Basic).
  See: https://developer.x.com/en/portal/products

Examples:
  xp "Hello from xp!"
  xp tweet "Hello" --json
  xp thread "First tweet" "Second tweet" "Third tweet"
  xp reply 1234567890123456789 "Great thread!"
  xp get 1234567890123456789 --json
  xp me --limit 20
  xp me --before 1234567890123456789
  xp me --limit 20 --before 1234567890123456789
  xp me --json
  xp delete 1234567890123456789
  xp "Hello" --image photo.jpg
  xp tweet "Hello" --image a.jpg --image b.jpg
  xp reply 1234567890123456789 "Nice!" --image reaction.png
  xp thread "First" "Second" --image cover.jpg
`;

async function main(): Promise<void> {
  const jsonFlag = Deno.args.includes("--json");

  // Extract --image flags and their values
  const imagePaths: string[] = [];
  const filteredArgs: string[] = [];
  const rawArgs = Deno.args.filter((a) => a !== "--json");
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--image") {
      const path = rawArgs[++i];
      if (!path) throw new Error("--image requires a file path");
      imagePaths.push(path);
    } else {
      filteredArgs.push(rawArgs[i]!);
    }
  }
  const args = filteredArgs;

  if (args.length === 0) {
    console.log(HELP);
    Deno.exit(0);
  }

  const command = args[0]!;

  // --image is only supported for tweet, thread, reply, and default (shorthand tweet)
  const NON_IMAGE_COMMANDS = new Set([
    "help", "--help", "-h", "version", "--version", "-v",
    "get", "me", "delete", "cache", "auth", "config", "upgrade", "completions",
  ]);
  if (imagePaths.length > 0 && NON_IMAGE_COMMANDS.has(command)) {
    throw new Error(`--image is not supported for the "${command}" command`);
  }

  switch (command) {
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      break;

    case "version":
    case "--version":
    case "-v":
      console.log(`xp ${VERSION}`);
      break;

    case "tweet":
      if (!args[1]) {
        throw new Error("Text is required: xp tweet <text>");
      }
      await tweetCommand(args[1], jsonFlag, imagePaths.length ? imagePaths : undefined);
      break;

    case "thread":
      await threadCommand(args.slice(1), jsonFlag, imagePaths.length ? imagePaths : undefined);
      break;

    case "reply":
      if (!args[1]) {
        throw new Error("Tweet ID is required: xp reply <tweet_id> <text>");
      }
      if (!args[2]) {
        throw new Error("Text is required: xp reply <tweet_id> <text>");
      }
      await replyCommand(args[1], args[2], jsonFlag, imagePaths.length ? imagePaths : undefined);
      break;

    case "get":
      if (!args[1]) {
        throw new Error("Tweet ID is required: xp get <tweet_id>");
      }
      await getCommand(args[1], jsonFlag);
      break;

    case "me": {
      const meArgs = args.slice(1);
      let beforeId: string | undefined;
      let afterId: string | undefined;
      let limit: string | undefined;
      for (let i = 0; i < meArgs.length; i++) {
        if (meArgs[i] === "--before") {
          beforeId = meArgs[++i];
          if (!beforeId) throw new Error("Tweet ID is required: xp me --before <tweet_id>");
        } else if (meArgs[i] === "--after") {
          afterId = meArgs[++i];
          if (!afterId) throw new Error("Tweet ID is required: xp me --after <tweet_id>");
        } else if (meArgs[i] === "--limit") {
          limit = meArgs[++i];
          if (!limit) throw new Error("Number is required: xp me --limit <N>");
        } else {
          throw new Error(`Unknown argument: ${meArgs[i]}\nUsage: xp me [--limit N] [--before <id>] [--after <id>]`);
        }
      }
      await meCommand({ limit, beforeId, afterId, json: jsonFlag });
      break;
    }


    case "delete":
      if (!args[1]) {
        throw new Error("Tweet ID is required: xp delete <tweet_id>");
      }
      await deleteCommand(args[1], jsonFlag);
      break;

    case "cache":
      if (args[1] === "show") {
        if (!args[2]) {
          throw new Error("Tweet ID is required: xp cache show <tweet_id>");
        }
        await cacheShowCommand(args[2], jsonFlag);
      } else if (args[1] === "clear") {
        await cacheClearCommand();
      } else {
        const cacheArgs = args.slice(args[1] === "list" ? 2 : 1);
        let cacheLimit: string | undefined;
        let cacheYear: string | undefined;
        let cacheMonth: string | undefined;
        for (let i = 0; i < cacheArgs.length; i++) {
          if (cacheArgs[i] === "--limit") {
            cacheLimit = cacheArgs[++i];
            if (!cacheLimit) throw new Error("Number is required: xp cache list --limit <N>");
          } else if (cacheArgs[i] === "--year") {
            cacheYear = cacheArgs[++i];
            if (!cacheYear) throw new Error("Year is required: xp cache list --year <YYYY>");
          } else if (cacheArgs[i] === "--month") {
            cacheMonth = cacheArgs[++i];
            if (!cacheMonth) throw new Error("Month is required: xp cache list --month <M>");
          } else {
            throw new Error(`Unknown argument: ${cacheArgs[i]}\nUsage: xp cache list [--limit N] [--year YYYY] [--month M]`);
          }
        }
        await cacheListCommand({ limit: cacheLimit, year: cacheYear, month: cacheMonth, json: jsonFlag });
      }
      break;

    case "auth":
      if (args[1] === "login") {
        await authLoginCommand();
      } else if (args[1] === "logout") {
        await authLogoutCommand();
      } else {
        throw new Error("Usage: xp auth login | xp auth logout");
      }
      break;

    case "upgrade":
      await upgradeCommand();
      break;

    case "completions":
      if (!args[1]) {
        throw new Error("Shell is required: xp completions fish|bash|zsh");
      }
      completionsCommand(args[1]);
      break;

    case "config":
      if (args[1] === "set") {
        await configSetCommand(args.slice(2));
      } else if (args[1] === "unset") {
        await configUnsetCommand(args.slice(2));
      } else if (args[1] === "show") {
        await configShowCommand();
      } else {
        throw new Error("Usage: xp config set | xp config unset | xp config show");
      }
      break;

    default:
      // Treat as direct tweet text (shorthand: xp "Hello")
      await tweetCommand(command, jsonFlag, imagePaths.length ? imagePaths : undefined);
      break;
  }
}

try {
  await main();
} catch (e) {
  const jsonFlag = Deno.args.includes("--json");
  console.error(formatError(e instanceof Error ? e.message : String(e), jsonFlag));
  Deno.exit(1);
}
