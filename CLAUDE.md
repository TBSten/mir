# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mir はスニペット（ディレクトリ構造含む）を配布・取得する CLI ツール。Handlebars テンプレートで変数展開し、ファイル名・ファイル内容を動的に生成する。

## Monorepo Structure

| Package | Path | Description |
|---|---|---|
| `mir` (CLI) | `packages/cli/` | CLI tool (`npx mir`), published to npm as `@tbsten/mir` |
| `@mir/web` | `packages/web/` | Web app (HonoX + Cloudflare Pages) |

npm workspaces で管理。

## Build & Dev Commands

```bash
npm install                        # 依存インストール
npm run build                      # 全パッケージビルド
npm run dev                        # 全パッケージ watch モード
npm test                           # 全パッケージテスト (vitest)
npm run typecheck                  # 全パッケージ型チェック

# CLI パッケージ単体
npm run build -w packages/cli      # tsup でビルド → dist/cli.js
npm test -w packages/cli           # vitest run
npm run test:watch -w packages/cli # vitest (watch)
npm run typecheck -w packages/cli  # tsc --noEmit

# Web パッケージ単体
npm run build -w packages/web      # vite build
npm run dev -w packages/web        # vite dev server
npm run deploy -w packages/web     # wrangler pages deploy
```

## CLI Architecture

- **Entry point**: `packages/cli/src/cli.ts` → `packages/cli/src/commands/run.ts`
- **Build**: tsup (ESM, target node18, `#!/usr/bin/env node` banner)
- **Test**: vitest
- **Output**: `packages/cli/dist/cli.js`

### CLI Commands (per docs/)

| Command | Description |
|---|---|
| `mir create <name>` | `.mir/snippets/` に snippet の雛形を作成 |
| `mir publish <name>` | snippet をローカル registry に登録 |
| `mir install <name>` | registry から snippet をインストール |

### Key Concepts

- **Snippet 定義**: `.mir/snippets/<name>.yaml` (スキーマ: `schema/v1/snippet.schema.json`)
- **テンプレートファイル**: `.mir/snippets/<name>/` 内の Handlebars テンプレート
- **Registry**: ローカル (`~/.mir/registry/`) またはリモート (URL)
- **Global config**: `~/.mir/mirconfig.yaml` (スキーマ: `schema/v1/mirconfig.schema.json`)

## Documentation

仕様ドキュメントが `docs/` にある。実装時は必ず参照すること。

- `docs/command/` - 各コマンドの仕様 (create, publish, install)
- `docs/settings/` - 設定ファイル仕様 (snippet-yaml, mirconfig-yaml)
- `docs/protocol/` - ファイルシステム操作フロー (create-flow, publish-flow, install-flow, registry)
- `schema/v1/` - JSON Schema (snippet, mirconfig)

## TypeScript Config

- Target: ES2022, Module: ESNext, moduleResolution: bundler
- Strict mode enabled
- Root tsconfig uses project references (`packages/cli`, `packages/web`)
