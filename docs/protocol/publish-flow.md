# publish フロー

`mir publish <name>` 実行時のファイルシステム操作フローを定義する。

## フロー

```
1. ソースファイル確認
2. snippet 定義バリデーション
3. registry 重複チェック
4. registry へコピー
5. 完了メッセージ表示
```

### Step 1: ソースファイル確認

`.mir/snippets/<name>.yaml` と `.mir/snippets/<name>/` の両方が存在するか確認する。どちらかが欠けている場合はエラー。

### Step 2: snippet 定義バリデーション

`.mir/snippets/<name>.yaml` を読み取り、スキーマに基づいてバリデーションを行う。

### Step 3: 対象 registry の決定と重複チェック

登録先 registry を決定する:

- `--registry` 指定時: 該当 registry を使用。存在しない場合はエラー
- 未指定時: `registries` の先頭のローカル registry を使用

**リモート registry（`url` 指定）は読み取り専用のため、publish 先に指定できない。** `--registry` でリモート registry を指定した場合、または全ての registry がリモートの場合はエラーになる。

対象 registry に同名の snippet が存在するか確認する。

- 存在しない → Step 4 へ
- 存在する + `--force` なし → エラー
- 存在する + `--force` あり → 既存を削除して Step 4 へ

### Step 4: registry へコピー

ソースファイルを registry にコピーする。

### Step 5: 完了メッセージ表示

登録した snippet の情報を表示する。

## ファイルシステム操作一覧

| 操作 | パス | 条件 |
|---|---|---|
| 存在確認 | `.mir/snippets/<name>.yaml` | 常に実行。存在しない場合エラー |
| 存在確認 | `.mir/snippets/<name>/` | 常に実行。存在しない場合エラー |
| ファイル読み取り | `.mir/snippets/<name>.yaml` | 常に実行（バリデーション用） |
| 存在確認 | `<registry-path>/<name>.yaml` | 常に実行（重複チェック） |
| ディレクトリ作成 | `<registry-path>/` | 存在しない場合のみ |
| ディレクトリ削除 | `<registry-path>/<name>/` | `--force` かつ既存がある場合 |
| ファイル削除 | `<registry-path>/<name>.yaml` | `--force` かつ既存がある場合 |
| ファイルコピー | `.mir/snippets/<name>.yaml` → `<registry-path>/<name>.yaml` | 常に実行 |
| ディレクトリコピー | `.mir/snippets/<name>/` → `<registry-path>/<name>/` | 常に実行 |

## エラーケース

| エラー | 条件 | メッセージ例 |
|---|---|---|
| 定義ファイル不在 | `.mir/snippets/<name>.yaml` が存在しない | `Snippet "<name>" not found` |
| テンプレート不在 | `.mir/snippets/<name>/` が存在しない | `Template directory for "<name>" not found` |
| バリデーション失敗 | YAML が snippet スキーマに適合しない | `Invalid snippet definition: <details>` |
| 重複（force なし） | 対象 registry に同名 snippet が存在 | `Snippet "<name>" already exists in registry. Use --force to overwrite` |
| registry 不在 | `--registry` で指定した名前の registry が存在しない | `Registry "<name>" not found in config` |
| リモート registry | publish 先にリモート registry が指定された | `Cannot publish to remote registry "<name>"` |
| ローカル registry なし | 全ての registry がリモートで publish 先がない | `No local registry available for publishing` |

## 関連

- [mir publish コマンド](../command/publish.md) - コマンドの使用方法
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - 定義ファイルの仕様
- [registry プロトコル](./registry.md) - registry の構造と規則
