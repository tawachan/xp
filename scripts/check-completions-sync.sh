#!/bin/bash
# Check that commands in main.ts are reflected in completions.ts
# Used as a Claude Code hook to catch missing completions updates.

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MAIN="$PROJECT_DIR/main.ts"
COMP="$PROJECT_DIR/commands/completions.ts"

if [ ! -f "$MAIN" ] || [ ! -f "$COMP" ]; then
  exit 0
fi

# Extract case labels from main.ts switch (these are the commands)
main_commands=$(sed -n 's/^[[:space:]]*case "\([^"]*\)".*/\1/p' "$MAIN" | grep -v '^-' | sort -u)

# Extract commands from fish completions (most readable source of truth)
comp_commands=$(sed -n "s/.*__fish_use_subcommand' -a \([^ ]*\).*/\1/p" "$COMP" | sort -u)

missing=""
for cmd in $main_commands; do
  if ! echo "$comp_commands" | grep -qx "$cmd"; then
    missing="$missing $cmd"
  fi
done

if [ -n "$missing" ]; then
  echo "COMPLETIONS OUT OF SYNC: commands in main.ts missing from completions.ts:$missing"
  echo "Please update commands/completions.ts (Fish, Bash, Zsh sections) to include these commands."
  exit 1
fi
