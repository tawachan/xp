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

### Delete a tweet

```bash
xp delete 1234567890123456789
```

Output: `deleted: 1234567890123456789`

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
- `Config not found` → credentials not set up
- `Authentication failed` → invalid or expired tokens
- `Permission denied` → app needs Read and Write access
- `Rate limit exceeded` → wait until reset time shown
- `Text is too long` → tweet exceeds 280 characters

### Tips for agents

- Always check exit code (0 = success, 1 = error)
- Parse `tweet_id:` from output to reference posted tweets
- Use `xp delete <tweet_id>` to clean up test tweets
- 280 character limit per tweet; use `xp thread` for longer content
- Config is stored at `~/.config/xp/config.json`

## Development

```bash
deno task dev <args>     # Run in dev mode
deno task check          # Type check
deno task compile        # Compile to binary
```

## Project Structure

- `main.ts` - Entry point, command routing
- `commands/` - Command implementations (tweet, thread, delete, config, auth, completions)
- `lib/oauth.ts` - OAuth 1.0a signatures (WebCrypto API, zero npm deps)
- `lib/x-client.ts` - X API v2 HTTP client
- `lib/config-store.ts` - Config file management (~/.config/xp/config.json)
- `lib/output.ts` - Machine-readable output formatting

## Key Design Decisions

- OAuth 1.0a signatures via WebCrypto API (zero npm dependencies)
- JSON body is NOT included in OAuth signature base string
- Config stored at `~/.config/xp/config.json` with chmod 600
- Machine-readable output format for agent integration
- All CLI messages in English
