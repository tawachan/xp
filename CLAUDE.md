# xp - X (Twitter) CLI Tool

X APIを使ったツイート投稿CLIツール (Deno/TypeScript)

## Development

```bash
# Run in dev mode
deno task dev <args>

# Type check
deno task check

# Compile to binary
deno task compile
```

## Project Structure

- `main.ts` - Entry point, command routing
- `commands/` - Command implementations (tweet, thread, delete, config)
- `lib/` - Core libraries (OAuth 1.0a, API client, config store, output formatter)

## Key Design Decisions

- OAuth 1.0a signatures via WebCrypto API (zero npm dependencies)
- JSON body is NOT included in OAuth signature base string
- Config stored at `~/.config/xp/config.json` with chmod 600
- Machine-readable output format for agent integration
