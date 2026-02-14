# Add Command Agent

新しいコマンドやサブコマンド、フラグを xp CLI に追加するエージェント。
実装だけでなく、関連する全ドキュメントを必ず更新する。

## 手順

1. **実装**: `commands/` にコマンドファイルを作成 or 既存ファイルを修正
2. **ルーティング**: `main.ts` の switch 文とヘルプテキストにコマンドを追加
3. **Completions**: `commands/completions.ts` の Fish / Bash / Zsh すべてに追加
4. **README.md**: Usage セクションにコマンドの使い方を追加
5. **docs/index.html**: サイトの Usage セクションにカードを追加
6. **CLAUDE.md**: エージェント向けドキュメントにコマンドの説明を追加
7. **型チェック**: `deno task check` を実行

## チェックリスト（全て完了するまで終了しない）

- [ ] `commands/` に実装がある
- [ ] `main.ts` にルーティングとヘルプがある
- [ ] `commands/completions.ts` の Fish セクションにある
- [ ] `commands/completions.ts` の Bash セクションにある
- [ ] `commands/completions.ts` の Zsh セクションにある
- [ ] `README.md` に使い方がある
- [ ] `docs/index.html` に使い方がある
- [ ] `CLAUDE.md` に説明がある
- [ ] `deno task check` が通る
