# xp - X (Twitter) CLI Tool

Post tweets from the terminal. Zero dependencies, single binary.

## Using xp from an AI Agent

xp is designed for both humans and AI agents. Output is machine-readable.

### Post a tweet

```bash
xp "Hello from AI agent"
```

Output:
```
tweet_id: 1234567890123456789
url: https://x.com/i/status/1234567890123456789
```

### Post a thread

```bash
xp thread "First tweet" "Second tweet" "Third tweet"
```

Output:
```
[1/3]
tweet_id: 1234567890123456789
url: https://x.com/i/status/1234567890123456789

[2/3]
tweet_id: 1234567890123456790
url: https://x.com/i/status/1234567890123456790
```

### Reply to a tweet

```bash
xp reply 1234567890123456789 "Great thread!"
```

Output:
```text
tweet_id: 1234567890123456790
url: https://x.com/i/status/1234567890123456790
```

### Fetch a tweet (requires paid plan)

```bash
xp get 1234567890123456789
```

Output:
```text
tweet_id: 1234567890123456789
text: Hello world
created_at: 2024-01-15T10:30:00.000Z
url: https://x.com/i/status/1234567890123456789
```

### List your recent tweets (requires paid plan)

```bash
xp me                                      # default: 10 tweets
xp me --limit 20                           # up to 100
xp me --before 1234567890123456789         # tweets older than this ID
xp me --after 1234567890123456789          # tweets newer than this ID
xp me --limit 20 --before 1234567890123456789  # combine limit with cursor
```

Output:
```text
[1/10]
tweet_id: 1234567890123456789
text: Hello world
created_at: 2024-01-15T10:30:00.000Z
url: https://x.com/i/status/1234567890123456789

[2/10]
...
```

### Delete a tweet

```bash
xp delete 1234567890123456789
```

Output: `deleted: 1234567890123456789`

### Cache (offline access to previously fetched tweets)

`xp get` caches tweets automatically. `xp me` also saves all fetched tweets to cache.

```bash
xp cache list              # List all cached tweets
xp cache show <tweet_id>   # Show a specific cached tweet
xp cache clear             # Delete all cached tweets
```

Output format is identical to `me` and `get` respectively. Supports `--json`.

Cache is stored at `~/.config/xp/cache/tweets.json`.

### Setup (non-interactive)

```bash
xp config set --api-key=KEY --api-secret=SECRET --access-token=TOKEN --access-token-secret=TOKEN_SECRET
```

### Error handling

All errors output to stderr with `error:` prefix and exit code 1:
```
error: Authentication failed. Run `xp auth login` to reconfigure
```

Common errors:
- `Invalid tweet ID` → must be a numeric ID
- `Config not found` → credentials not set up
- `Authentication failed` → invalid or expired tokens
- `Permission denied` → app needs Read and Write access
- `Not found` → tweet deleted or ID is invalid
- `Bad request` → malformed request (details included)
- `This feature requires a paid X API plan` → `get`/`me` need Pay-Per-Use or Basic
- `Rate limit exceeded` → wait until reset time shown
- `Text is too long` → tweet exceeds 280 characters

### JSON output

Add `--json` to any command for structured JSON output:

```bash
xp "Hello" --json
```

```json
{"tweet_id":"1234567890123456789","url":"https://x.com/i/status/1234567890123456789"}
```

```bash
xp me --json
```

```json
[{"tweet_id":"123","text":"Hello","created_at":"2024-01-15T10:30:00.000Z","url":"https://x.com/i/status/123"}]
```

Errors with `--json` also output JSON to stderr:

```json
{"error":"Invalid tweet ID: \"abc\" (must be a numeric ID)"}
```

### Upgrade

```bash
xp upgrade
```

### Tips for agents

- Use `--json` for reliable parsing (recommended over text format)
- Always check exit code (0 = success, 1 = error)
- Parse `tweet_id` from JSON output to reference posted tweets
- Use `xp delete <tweet_id>` to clean up test tweets
- 280 character limit per tweet; use `xp thread` for longer content
- Tweet IDs must be numeric; invalid IDs are rejected before API call
- Config is stored at `~/.config/xp/config.json`
- `xp get` uses cache first, avoiding paid API calls for previously fetched tweets
- Use `xp cache list --json` to get all cached tweets programmatically

## Development

```bash
deno task dev <args>     # Run in dev mode
deno task check          # Type check
deno task compile        # Compile to binary
```

## Project Structure

- `main.ts` - Entry point, command routing
- `commands/` - Command implementations (tweet, thread, reply, get, me, delete, cache, config, auth, upgrade, completions)
- `lib/oauth.ts` - OAuth 1.0a signatures (WebCrypto API, zero npm deps)
- `lib/x-client.ts` - X API v2 HTTP client
- `lib/config-store.ts` - Config file management (~/.config/xp/config.json)
- `lib/cache-store.ts` - Tweet cache management (~/.config/xp/cache/tweets.json)
- `lib/output.ts` - Machine-readable output formatting

## Rules

- When adding, removing, or renaming a command or subcommand in `main.ts`, you MUST update ALL of the following to match:
  - `commands/completions.ts` (Fish, Bash, Zsh sections)
  - `README.md` (usage examples and command list)
  - `docs/index.html` (Usage section on the website)
  - `CLAUDE.md` (agent documentation)
- When adding or removing flags for a command, you MUST update the same files listed above
- Run `deno task check` after modifying completions to ensure no type errors

## Key Design Decisions

- OAuth 1.0a signatures via WebCrypto API (zero npm dependencies)
- JSON body is NOT included in OAuth signature base string
- Config stored at `~/.config/xp/config.json` with chmod 600
- Machine-readable output format for agent integration
- All CLI messages in English
