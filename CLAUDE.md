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

**ビルド順序**: `npm run build` は依存関係順（mir-core → cli → official-registry）で実行される。`registry-sdk` は build スクリプトなし。

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

| Command | Alias | Description |
|---|---|---|
| `mir init` | | `.mir/` ディレクトリを初期化（サンプル snippet、config, README 生成） |
| `mir list` | `ls`, `l` | 利用可能な snippet を一覧表示（ローカル・リモート） |
| `mir info <name>` | | snippet の詳細情報を表示（変数一覧など） |
| `mir create <name>` | `c` | `.mir/snippets/` に snippet の雛形を作成 |
| `mir publish <name>` | | snippet を registry に登録（ローカル・リモート両対応） |
| `mir install <name>` | `i` | registry から snippet をインストール |
| `mir sync <name>` | `s` | テンプレートの変数を snippet 定義に同期 |
| `mir validate <name>` | `v` | snippet 定義のバリデーション |
| `mir clone <name> [alias]` | | snippet を複製して新しい snippet を作成 |
| `mir preview <name>` | | snippet のインストール結果をプレビュー表示 |
| `mir login` | | リモート registry に GitHub OAuth でログイン |
| `mir logout` | | リモート registry からログアウト |

### Key Concepts

- **Snippet 定義**: `.mir/snippets/<name>.yaml` (スキーマ: `schema/v1/snippet.schema.json`)
- **テンプレートファイル**: `.mir/snippets/<name>/` 内の Handlebars テンプレート
- **Registry**: ローカル (`~/.mir/registry/`) またはリモート (URL)
- **Global config**: `~/.mir/config.yaml` (スキーマ: `schema/v1/mirconfig.schema.json`)

### Template Helpers

テンプレートファイル・ファイル名・variable の default 値で使える Handlebars ヘルパー。
実装: `packages/mir-core/src/helpers/`

- **ケース変換**: `lowercase`, `uppercase`, `capitalize`, `uncapitalize`, `camelCase`, `pascalCase`, `snakeCase`, `kebabCase`, `dotCase`, `pathCase`
- **文字列操作**: `replace`, `concat`, `slice`, `trim`, `length`
- **条件判定** (`#if` と併用): `contains`, `startsWith`, `endsWith`

### Variable Default のテンプレート展開

variable の `default` 値に Handlebars テンプレートを書くと、先に定義された変数で展開される。
実装: `packages/mir-core/src/template-engine.ts` の `expandDefaultValue()`

```yaml
variables:
  packageDir:
    schema: { type: string }
  packageName:
    schema:
      type: string
      default: "{{ replace packageDir '/' '.' }}"
```

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
