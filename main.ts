import { tweetCommand } from "./commands/tweet.ts";
import { threadCommand } from "./commands/thread.ts";
import { deleteCommand } from "./commands/delete.ts";
import { configSetCommand, configShowCommand } from "./commands/config.ts";
import { authLoginCommand } from "./commands/auth.ts";
import { formatError } from "./lib/output.ts";

const VERSION = "0.1.0";

const HELP = `xp - X (Twitter) CLI Tool v${VERSION}

Usage:
  xp <text>                          Post a tweet
  xp tweet <text>                    Post a tweet
  xp thread <text1> <text2> ...      Post a thread
  xp delete <tweet_id>               Delete a tweet
  xp auth login                       Authenticate via browser (OAuth PIN flow)
  xp config set [flags]              Set API credentials
  xp config show                     Show current config
  xp help                            Show this help
  xp version                         Show version

Config flags:
  --api-key=VALUE
  --api-secret=VALUE
  --access-token=VALUE
  --access-token-secret=VALUE

Setup:
  xp config set --api-key=xxx --api-secret=xxx
  xp auth login

Examples:
  xp "Hello from xp!"
  xp thread "First tweet" "Second tweet" "Third tweet"
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
        throw new Error("テキストを指定してください: xp tweet <text>");
      }
      await tweetCommand(args[1]);
      break;

    case "thread":
      await threadCommand(args.slice(1));
      break;

    case "delete":
      if (!args[1]) {
        throw new Error("ツイートIDを指定してください: xp delete <tweet_id>");
      }
      await deleteCommand(args[1]);
      break;

    case "auth":
      if (args[1] === "login") {
        await authLoginCommand();
      } else {
        throw new Error("使い方: xp auth login");
      }
      break;

    case "config":
      if (args[1] === "set") {
        await configSetCommand(args.slice(2));
      } else if (args[1] === "show") {
        await configShowCommand();
      } else {
        throw new Error("使い方: xp config set | xp config show");
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
