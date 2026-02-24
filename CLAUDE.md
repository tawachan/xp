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

### Post with images

```bash
xp "Hello" --image photo.jpg                          # 1 image
xp tweet "Hello" --image a.jpg --image b.jpg           # multiple (max 4)
xp reply 1234567890123456789 "Nice!" --image reaction.png  # reply with image
xp thread "First" "Second" --image cover.jpg           # image on first tweet
```

Output is the same as a normal tweet. Constraints:
- Max 4 images per tweet
- Max 5 MB per image
- Supported formats: JPG, PNG, GIF, WebP

### Fetch a tweet (requires paid plan)

```bash
xp get 1234567890123456789
```

Output:
```text
tweet_id: 1234567890123456789
author_id: 9876543210
author_username: johndoe
text: Hello world
created_at: 2024-01-15T10:30:00.000Z
url: https://x.com/i/status/1234567890123456789
```

### List your recent tweets (requires paid plan)

```bash
xp me                                      # default: 100 tweets (API max per request)
xp me --limit 20                           # 5-100
xp me --before 1234567890123456789         # tweets older than this ID
xp me --after 1234567890123456789          # tweets newer than this ID
xp me --limit 20 --before 1234567890123456789  # combine limit with cursor
```

Output:
```text
[1/10]
tweet_id: 1234567890123456789
author_id: 9876543210
author_username: tawachan39
text: Hello world
created_at: 2024-01-15T10:30:00.000Z
url: https://x.com/i/status/1234567890123456789

[2/10]
...
```

### List your mentions (requires paid plan)

```bash
xp mentions                                    # default: 100 mentions (API max per request)
xp mentions --limit 20                         # 5-100
xp mentions --before 1234567890123456789       # mentions older than this ID
xp mentions --after 1234567890123456789        # mentions newer than this ID
xp mentions --limit 20 --before 1234567890123456789  # combine limit with cursor
```

Output:
```text
[1/10]
tweet_id: 1234567890123456789
author_id: 9876543210
author_username: johndoe
text: @you Great thread!
created_at: 2024-01-15T10:30:00.000Z
url: https://x.com/i/status/1234567890123456789

[2/10]
...
```

### Schedule a tweet

```bash
xp schedule add "Scheduled tweet" --at 2026-03-01T10:00:00+09:00
xp schedule add tweet "Hello" --at 2026-03-01T10:00:00Z         # explicit type
xp schedule add thread "First" "Second" --at 2026-03-01T10:00   # thread
xp schedule add reply 1234567890123456789 "Nice!" --at 2026-03-01T10:00:00+09:00
xp schedule add "Hello" --at 2026-03-01T10:00:00Z --image photo.jpg  # with image
```

Output:
```text
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
type: tweet
text: Scheduled tweet
scheduled_at: 2026-03-01T01:00:00.000Z
created_at: 2026-02-24T10:00:00.000Z
status: pending
```

### List scheduled tweets

```bash
xp schedule list                           # all schedules (sorted by scheduled_at)
xp schedule list --status pending          # filter: pending, posted, failed
xp schedule list --json
```

Output:
```text
[1/2]
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
type: tweet
text: Scheduled tweet
scheduled_at: 2026-03-01T01:00:00.000Z
created_at: 2026-02-24T10:00:00.000Z
status: pending

[2/2]
...
```

### Show a scheduled tweet

```bash
xp schedule show <id>                      # full UUID or unique prefix
xp schedule show a1b2c3d4                  # 8-char prefix
```

### Remove a scheduled tweet

```bash
xp schedule remove <id>
xp schedule remove a1b2c3d4
```

Output: `removed: a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Run due scheduled tweets

```bash
xp schedule run                            # post all pending tweets with scheduledAt <= now
xp schedule run --json
```

Output:
```text
posted: a1b2c3d4-... -> 1234567890123456789
failed: b2c3d4e5-... -> Authentication failed

total: 1 posted, 1 failed
```

Exit code 1 if any tweet fails. Intended to be called from cron/CI.

### Clear scheduled tweets

```bash
xp schedule clear                          # remove posted and failed entries
xp schedule clear --all                    # remove all (including pending)
```

Output: `cleared: 3 schedule(s)`

### Delete a tweet

```bash
xp delete 1234567890123456789
```

Output: `deleted: 1234567890123456789`

### Cache (offline access to previously fetched tweets)

`xp get` caches tweets automatically. `xp me` and `xp mentions` also save all fetched tweets to cache.

```bash
xp cache list                              # List all cached tweets (sorted by created_at, newest first)
xp cache list --limit 20                   # Show first 20 cached tweets
xp cache list --year 2026                  # Filter by year
xp cache list --year 2026 --month 1        # Filter by year and month
xp cache list --year 2026 --limit 10       # Combine filters
xp cache show <tweet_id>                   # Show a specific cached tweet
xp cache clear                             # Delete all cached tweets
```

Output format is identical to `me` and `get` respectively. Supports `--json`.

Cache is stored at `~/.config/xp/cache/tweets.json` by default. Use `xp config set --cache-dir=PATH` to store cache in a custom location (e.g. a project directory for Git versioning or team sharing).

### Auth

```bash
xp auth login              # Authenticate via browser (OAuth PIN flow)
xp auth logout             # Remove saved credentials
```

### Setup (non-interactive)

```bash
xp config set --api-key=KEY --api-secret=SECRET --access-token=TOKEN --access-token-secret=TOKEN_SECRET
xp config set --cache-dir=~/my-cache       # Set custom cache directory (absolute path only)
xp config set --schedule-dir=~/my-sched   # Set custom schedule directory (absolute path only)
xp config unset --cache-dir                # Reset cache directory to default
xp config unset --schedule-dir             # Reset schedule directory to default
xp config show             # Show current config (masked)
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
- `This feature requires a paid X API plan` → `get`/`me`/`mentions` need Pay-Per-Use or Basic
- `Rate limit exceeded` → wait until reset time shown
- `Text is too long` → tweet exceeds 280 characters
- `File not found` → image file path does not exist
- `File too large` → image exceeds 5 MB limit
- `Unsupported image format` → must be JPG, PNG, GIF, or WebP
- `Too many images` → max 4 images per tweet
- `--cache-dir must be an absolute path` → relative paths are not allowed
- `--schedule-dir must be an absolute path` → relative paths are not allowed
- `--month requires --year` → `--month` cannot be used without `--year`
- `Scheduled time must be in the future` → --at must be a future datetime
- `Invalid datetime` → --at must be valid ISO 8601
- `Schedule not found` → invalid schedule ID or prefix
- `Ambiguous ID prefix` → prefix matches multiple schedules, use more characters

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
[{"tweet_id":"123","author_id":"456","author_username":"tawachan39","text":"Hello","created_at":"2024-01-15T10:30:00.000Z","url":"https://x.com/i/status/123"}]
```

```bash
xp mentions --json
```

```json
[{"tweet_id":"123","author_id":"456","author_username":"johndoe","text":"@you Hello!","created_at":"2024-01-15T10:30:00.000Z","url":"https://x.com/i/status/123"}]
```

```bash
xp schedule list --json
```

```json
[{"id":"a1b2c3d4-...","type":"tweet","texts":["Hello"],"scheduled_at":"2026-03-01T01:00:00.000Z","created_at":"2026-02-24T10:00:00.000Z","status":"pending"}]
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
- Use `xp config set --cache-dir=~/project/cache` to store cache in a custom directory (e.g. for Git versioning)
- Use `xp schedule add` + `xp schedule run` for scheduled posting from cron/CI
- Schedule IDs can be abbreviated to a unique prefix (e.g. first 8 chars)
- Schedule data is stored at `~/.config/xp/schedule/schedules.json` by default
- Use `xp config set --schedule-dir=PATH` to customize schedule storage location

## Development

```bash
deno task dev <args>     # Run in dev mode
deno task check          # Type check
deno task compile        # Compile to binary
```

## Project Structure

- `main.ts` - Entry point, command routing
- `commands/` - Command implementations (tweet, thread, reply, get, me, mentions, delete, schedule, cache, config, auth, upgrade, completions)
- `lib/oauth.ts` - OAuth 1.0a signatures (WebCrypto API, zero npm deps)
- `lib/x-client.ts` - X API v2 HTTP client
- `lib/media-upload.ts` - Image upload for tweets (X API v2 media upload)
- `lib/config-store.ts` - Config file management (~/.config/xp/config.json)
- `lib/cache-store.ts` - Tweet cache management (~/.config/xp/cache/tweets.json)
- `lib/schedule-store.ts` - Schedule management (~/.config/xp/schedule/schedules.json)
- `lib/output.ts` - Machine-readable output formatting

## Rules

- When adding, removing, or renaming a command/subcommand/flag in `main.ts`, you MUST update ALL of the following to match:
  - `commands/completions.ts` — Fish, Bash, Zsh sections
  - `README.md` — Usage section and command examples
  - `docs/index.html` — Usage section on the website
  - `CLAUDE.md` — Agent documentation
- Do not merge or consider a command change complete until all four files are updated

## Key Design Decisions

- OAuth 1.0a signatures via WebCrypto API (zero npm dependencies)
- JSON body is NOT included in OAuth signature base string
- Config stored at `~/.config/xp/config.json` with chmod 600
- Machine-readable output format for agent integration
- All CLI messages in English
