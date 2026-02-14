import { tweetCommand } from "./commands/tweet.ts";
import { threadCommand } from "./commands/thread.ts";
import { deleteCommand } from "./commands/delete.ts";
import { getCommand } from "./commands/get.ts";
import { meCommand } from "./commands/me.ts";
import { replyCommand } from "./commands/reply.ts";
import { configSetCommand, configShowCommand } from "./commands/config.ts";
import { authLoginCommand, authLogoutCommand } from "./commands/auth.ts";
import { completionsCommand } from "./commands/completions.ts";
import { upgradeCommand } from "./commands/upgrade.ts";
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
  xp me [limit]                      List your recent tweets (default: 10)
  xp delete <tweet_id>               Delete a tweet
  xp auth login                      Authenticate via browser (OAuth PIN flow)
  xp auth logout                     Remove saved credentials
  xp config set [flags]              Set API credentials
  xp config show                     Show current config
  xp upgrade                         Upgrade to the latest version
  xp completions <shell>             Generate shell completions (fish/bash/zsh)
  xp help                            Show this help
  xp version                         Show version

Config flags:
  --api-key=VALUE
  --api-secret=VALUE
  --access-token=VALUE
  --access-token-secret=VALUE

Setup:
  xp auth login

Note:
  The "get" and "me" commands require X API Basic plan ($200/month) or higher.
  The Free plan only supports posting tweets.

Examples:
  xp "Hello from xp!"
  xp thread "First tweet" "Second tweet" "Third tweet"
  xp reply 1234567890123456789 "Great thread!"
  xp get 1234567890123456789
  xp me 20
  xp delete 1234567890123456789
  xp config set --api-key=xxx --api-secret=xxx --access-token=xxx --access-token-secret=xxx
`;

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.length === 0) {
    console.log(HELP);
    Deno.exit(0);
  }

  const command = args[0]!;

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
      await tweetCommand(args[1]);
      break;

    case "thread":
      await threadCommand(args.slice(1));
      break;

    case "reply":
      if (!args[1]) {
        throw new Error("Tweet ID is required: xp reply <tweet_id> <text>");
      }
      if (!args[2]) {
        throw new Error("Text is required: xp reply <tweet_id> <text>");
      }
      await replyCommand(args[1], args[2]);
      break;

    case "get":
      if (!args[1]) {
        throw new Error("Tweet ID is required: xp get <tweet_id>");
      }
      await getCommand(args[1]);
      break;

    case "me":
      await meCommand(args[1]);
      break;

    case "delete":
      if (!args[1]) {
        throw new Error("Tweet ID is required: xp delete <tweet_id>");
      }
      await deleteCommand(args[1]);
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
      } else if (args[1] === "show") {
        await configShowCommand();
      } else {
        throw new Error("Usage: xp config set | xp config show");
      }
      break;

    default:
      // Treat as direct tweet text (shorthand: xp "Hello")
      await tweetCommand(command);
      break;
  }
}

try {
  await main();
} catch (e) {
  console.error(formatError(e instanceof Error ? e.message : String(e)));
  Deno.exit(1);
}
