# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mir はスニペット（ディレクトリ構造含む）を配布・取得する CLI ツール。Handlebars テンプレートで変数展開し、ファイル名・ファイル内容を動的に生成する。

## Monorepo Structure

| Package | Path | Description |
|---|---|---|
| `@mir/core` | `packages/mir-core/` | 共有コアロジック (テンプレート, スキーマ, バリデーション, i18n 等) |
| `mir` (CLI) | `packages/cli/` | CLI tool (`npx mir`), published to npm as `@tbsten/mir` |
| `@mir/registry-sdk` | `packages/registry-sdk/` | リモート registry 実装用 SDK |
| `@mir/official-registry` | `packages/official-registry/` | 公式 registry (HonoX + Cloudflare Pages) |

npm workspaces で管理。

**依存関係**: `mir-core` ← `cli`, `registry-sdk` / `registry-sdk` ← `official-registry`

## Build & Dev Commands

```bash
npm install                        # 依存インストール
npm run build                      # 全パッケージビルド
npm run dev                        # 全パッケージ watch モード
npm test                           # 全パッケージテスト (vitest)
npm run typecheck                  # 全パッケージ型チェック

# CLI パッケージ単体
npm run build:cli                  # tsup でビルド → dist/cli.js
npm run dev:cli                    # tsup --watch
npm test:cli                       # vitest run
npm run test:watch -w packages/cli # vitest (watch)
npm run typecheck -w packages/cli  # tsc --noEmit

# Web (Official Registry) パッケージ単体
npm run build:web                  # vite build
npm run dev:web                    # vite dev server
npm run deploy -w packages/official-registry  # wrangler pages deploy

# CLI 実行
npm run mir -- --help              # CLI 動作確認
```

## CLI Architecture

- **Entry point**: `packages/cli/src/cli.ts`
- **Build**: tsup (ESM, target node18, `#!/usr/bin/env node` banner)
- **Test**: vitest
- **Output**: `packages/cli/dist/cli.js`
- **Core logic**: `@mir/core` (packages/mir-core/) から import

### CLI Commands (per docs/)

| Command | Description |
|---|---|
| `mir init` | `.mir/` ディレクトリを初期化（サンプル snippet、config, README 生成） |
| `mir list` / `mir ls` | 利用可能な snippet を一覧表示（ローカル・リモート） |
| `mir info <name>` | snippet の詳細情報を表示（変数一覧など） |
| `mir create <name>` | `.mir/snippets/` に snippet の雛形を作成 |
| `mir publish <name>` | snippet をローカル registry に登録 |
| `mir install <name>` | registry から snippet をインストール |
| `mir sync <name>` | テンプレートの変数を snippet 定義に同期 |

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
- Root tsconfig uses project references (`packages/mir-core`, `packages/cli`, `packages/registry-sdk`, `packages/official-registry`)
