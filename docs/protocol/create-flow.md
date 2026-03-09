# create フロー

`mir create <name>` 実行時のファイルシステム操作フローを定義する。

## フロー

```
1. 引数バリデーション
2. 既存チェック
3. ディレクトリ確認
4. ファイル生成
5. 完了メッセージ表示
```

### Step 1: 引数バリデーション

`name` が命名規則（`^[a-zA-Z0-9][a-zA-Z0-9-]*$`）に適合するか検証する。

### Step 2: 既存チェック

`.mir/snippets/<name>.yaml` が既に存在するか確認する。存在する場合はエラー。

### Step 3: ディレクトリ確認

`.mir/snippets/` ディレクトリが存在しない場合は作成する。

### Step 4: ファイル生成

定義ファイルとテンプレートディレクトリを生成する。

### Step 5: 完了メッセージ表示

作成した snippet の情報を表示する。

## ファイルシステム操作一覧

| 操作 | パス | 条件 |
|---|---|---|
| 存在確認 | `.mir/snippets/<name>.yaml` | 常に実行。存在する場合エラー |
| ディレクトリ作成 | `.mir/snippets/` | 存在しない場合のみ |
| ファイル作成 | `.mir/snippets/<name>.yaml` | 常に実行 |
| ディレクトリ作成 | `.mir/snippets/<name>/` | 常に実行 |

### 生成される snippet 定義ファイル

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/TBSten/mir/refs/heads/main/schema/v1/snippet.schema.json
name: <name>
description: ""
variables: {}
hooks:
  before-install: []
  after-install: []
```

`--description` オプションが指定された場合、`description` フィールドに値が設定される。

## エラーケース

| エラー | 条件 | メッセージ例 |
|---|---|---|
| 名前不正 | `name` が命名規則に適合しない | `Invalid snippet name: "<name>"` |
| 既存 snippet | `.mir/snippets/<name>.yaml` が既に存在 | `Snippet "<name>" already exists` |

## 関連

- [mir create コマンド](../command/create.md) - コマンドの使用方法
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - 生成されるファイルの仕様
- [registry プロトコル](./registry.md) - snippet の状態管理
