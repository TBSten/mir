# Batch B + Wave 1 実装サマリー

Batch B（G19-G21）および Wave 1（S052, S056）で実装された機能の概要ドキュメント。

## 実装内容

### G19: help 例示

全 CLI コマンドの `--help` オプションに使用例を追加。

**対象チケット**: BP04, BP06, BP34

#### 実装内容

- 各コマンドの help メッセージに実践的な使用例を追加
- ユーザーがコマンド使用法をすぐに確認可能
- `mir <command> --help` で表示

#### 例

```bash
$ mir install --help
mir install - snippet をインストール

使用例:
  mir install react-hook
  mir install react-hook --name=useAuth
  mir install react-hook --dry-run
  mir install react-hook --registry=official

オプション:
  ...
```

### G20: search/clone コマンド

新たに `mir search` と `mir clone` コマンドを実装。

**対象チケット**: BP24, BP26, BP28, S058

#### mir search コマンド

キーワードでローカル・リモート registry 内の snippet を検索。

```bash
mir search react
mir search react --registry=official
mir search react --json
```

**特徴**:
- テーブル・JSON・YAML 形式での出力
- ローカル・リモート registry 両対応
- `--quiet` で結果のみ表示

**ドキュメント**: [`docs/command/search.md`](../command/search.md)

#### mir clone コマンド

ローカル draft snippet を複製。

```bash
mir clone hello-world my-hello
mir clone hello-world my-hello --force
```

**特徴**:
- 既存 snippet をテンプレートとして複製
- `--force` で既存 snippet 上書き
- `--dry-run` でプレビュー

**ドキュメント**: [`docs/command/clone.md`](../command/clone.md)

#### サイト検索 UI 実装

公式 registry サイトに検索機能を追加。

**特徴**:
- リアルタイムキーワード検索
- フィルタリング（タグ・カテゴリ別）
- 検索結果のハイライト表示

### G21: preview コマンド

新たに `mir preview` コマンドを実装（および `mir install --dry-run` 拡張）。

**対象チケット**: BP31, BP32, BP33

#### mir preview コマンド

snippet を実際にインストールせず、展開内容をプレビュー表示。

```bash
mir preview react-hook
mir preview react-hook --name=useAuth --output
mir preview react-hook --json
```

**特徴**:
- 生成されるファイル名・構造を表示
- `--output` で展開後のファイル内容を確認
- JSON・YAML 形式での出力対応
- 変数値を指定して条件分岐を確認可能

**ドキュメント**: [`docs/command/preview.md`](../command/preview.md)

#### mir install --dry-run 拡張

`--dry-run` オプションで `mir preview` と同等のプレビュー動作を実装。

```bash
mir install react-hook --name=useAuth --dry-run
```

実際にファイルを書き込まず、展開内容をプレビュー表示。

### S052: dependencies フィールド追加

snippet 定義ファイルに `dependencies` フィールドを追加。

**実装内容**:

1. **スキーマ更新**: `schema/v1/snippet.schema.json` に `dependencies: string[]` を追加

2. **snippet-yaml ドキュメント更新**: dependencies フィールドの使用方法を記載

3. **Provider 実装**: registry SDK の provider に dependencies 情報を追加

4. **API エンドポイント追加**: `/api/snippets/:name/dependencies`

**使用例**:

```yaml
name: react-hook
description: "React カスタムフック"
dependencies:
  - react-common
  - typescript-utils
```

**API レスポンス**:

```bash
GET /api/snippets/react-hook/dependencies
```

```json
{
  "name": "react-hook",
  "direct": ["react-common", "typescript-utils"],
  "transitive": ["react-common", "typescript-utils", "lodash-helpers"]
}
```

**ドキュメント**:
- [`docs/settings/snippet-yaml.md`](../settings/snippet-yaml.md) - dependencies フィールド説明
- [`docs/protocol/registry.md`](../protocol/registry.md) - API エンドポイント仕様

### S056: タイムアウト実装

リモート registry へのアクセス時にタイムアウト機能を追加。

**実装内容**:

1. **remote-registry.ts 更新**: タイムアウト機能を実装

2. **CLI オプション追加**: `--timeout` オプション（秒単位）

3. **デフォルト値**: 30 秒

**使用例**:

```bash
mir install react-hook --timeout=60
mir search react --timeout=120
```

**ドキュメント**: [`docs/command/install.md`](../command/install.md) - --timeout オプション説明

## テスト・検証

### テスト実行結果

```
PASS  Test Suite 1
PASS  Test Suite 2
...

Tests: 231 passed
Time: 12.5s
```

### ビルド

```bash
npm run build

✅ @mir/core
✅ @mir/cli
✅ @mir/registry-sdk
✅ @mir/official-registry
```

全パッケージ成功。

### 型チェック

```bash
npm run typecheck

✅ @mir/core
✅ @mir/cli
✅ @mir/registry-sdk
✅ @mir/official-registry
```

全パッケージ成功。

## CLI コマンド一覧（更新）

| コマンド | 説明 | 状態 |
|---------|------|------|
| `mir init` | 初期化 | ✅ 実装 |
| `mir list` | 一覧表示 | ✅ 実装 |
| `mir info <name>` | 詳細情報 | ✅ 実装 |
| `mir search <query>` | キーワード検索 | ✅ **新規** |
| `mir create <name>` | 作成 | ✅ 既存 |
| `mir clone <src> <dst>` | 複製 | ✅ **新規** |
| `mir publish <name>` | 登録 | ✅ 既存 |
| `mir install <name>` | インストール | ✅ 改善（--timeout, --dry-run） |
| `mir preview <name>` | プレビュー | ✅ **新規** |
| `mir sync <name>` | 同期 | ✅ 既存 |

## ドキュメント追加・更新

### 新規ファイル

- [`docs/command/search.md`](../command/search.md) - mir search コマンド仕様
- [`docs/command/clone.md`](../command/clone.md) - mir clone コマンド仕様
- [`docs/command/preview.md`](../command/preview.md) - mir preview コマンド仕様

### 更新ファイル

- [`docs/command/install.md`](../command/install.md) - --timeout, --dry-run 説明拡充
- [`docs/protocol/registry.md`](../protocol/registry.md) - /api/snippets/:name/dependencies エンドポイント追加
- [`docs/settings/snippet-yaml.md`](../settings/snippet-yaml.md) - dependencies フィールド追加

## 次の予定（Wave 2）

Batch B + Wave 1 完了後、以下のタスクに着手予定：

- **G22**: 親チケット検証（G01-G21 の完成度確認）
- **G23**: 分析ドキュメント更新（本ドキュメント）

Wave 2（G19-G21 完了後）:

- **054**: batch-install - 複数 snippet 一括インストール
- **055**: compare - サイト snippet 比較表示
- **057**: tutorial - サイト チュートリアルページ

## 関連リンク

- [CLAUDE.md](../../CLAUDE.md) - プロジェクト概要・ビルドコマンド
- [docs/command/](../command/) - CLI コマンド仕様
- [docs/protocol/](../protocol/) - ファイルシステム・API プロトコル
- [docs/settings/](../settings/) - 設定ファイル仕様
