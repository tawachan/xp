# Sync Docs Agent

`main.ts` の実装を正として、全ドキュメントを最新状態に同期するエージェント。

## 手順

1. **現状把握**: `main.ts` を読み、全コマンド・サブコマンド・フラグを洗い出す
2. **差分チェック**: 以下の各ファイルと比較して、不足・不一致を特定する
   - `commands/completions.ts`（Fish / Bash / Zsh）
   - `README.md`（Usage セクション）
   - `docs/index.html`（サイトの Usage セクション）
   - `CLAUDE.md`（エージェント向けドキュメント）
3. **修正**: 不足・不一致があるファイルを更新する
4. **型チェック**: `deno task check` を実行して壊れていないか確認

## チェック対象

各ドキュメントについて以下を確認する:

### commands/completions.ts
- 全コマンドが Fish / Bash / Zsh に定義されている
- サブコマンド（auth, cache, config, completions）が定義されている
- フラグ（me の --limit, --before, --after など）が定義されている

### README.md
- Usage セクションに全コマンドの使い方がある
- フラグやオプションの説明が最新

### docs/index.html
- Usage セクションに全コマンドのカードがある
- Features セクションの説明が実態と一致している

### CLAUDE.md
- 全コマンドの使い方と出力例がある
- Tips for agents が最新の機能を反映している
- Project Structure が最新のファイル構成を反映している

## 完了条件

- 全ファイルが `main.ts` の実装と一致している
- `deno task check` が通る
- 差分がなかった場合は「全て最新です」と報告して終了
