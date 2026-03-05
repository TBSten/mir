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

### Step 3: registry 重複チェック

ローカル registry（`~/.mir/registry/`）に同名の snippet が存在するか確認する。

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
| 存在確認 | `~/.mir/registry/<name>.yaml` | 常に実行（重複チェック） |
| ディレクトリ作成 | `~/.mir/registry/` | 存在しない場合のみ |
| ディレクトリ削除 | `~/.mir/registry/<name>/` | `--force` かつ既存がある場合 |
| ファイル削除 | `~/.mir/registry/<name>.yaml` | `--force` かつ既存がある場合 |
| ファイルコピー | `.mir/snippets/<name>.yaml` → `~/.mir/registry/<name>.yaml` | 常に実行 |
| ディレクトリコピー | `.mir/snippets/<name>/` → `~/.mir/registry/<name>/` | 常に実行 |

## エラーケース

| エラー | 条件 | メッセージ例 |
|---|---|---|
| 定義ファイル不在 | `.mir/snippets/<name>.yaml` が存在しない | `Snippet "<name>" not found` |
| テンプレート不在 | `.mir/snippets/<name>/` が存在しない | `Template directory for "<name>" not found` |
| バリデーション失敗 | YAML が snippet スキーマに適合しない | `Invalid snippet definition: <details>` |
| 重複（force なし） | registry に同名 snippet が存在 | `Snippet "<name>" already exists in registry. Use --force to overwrite` |

## 関連

- [mir publish コマンド](../command/publish.md) - コマンドの使用方法
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - 定義ファイルの仕様
- [registry プロトコル](./registry.md) - registry の構造と規則
