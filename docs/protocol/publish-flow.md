# publish フロー

`mir publish <name>` 実行時の操作フローを定義する。ローカル registry とリモート registry の両方に対応。

## フロー

```
1. ソースファイル確認
2. snippet 定義バリデーション
3. 対象 registry の決定
4. 確認プロンプト表示（interactive モード）
5. registry へ登録
6. 完了メッセージ表示
```

### Step 1: ソースファイル確認

`.mir/snippets/<name>.yaml` と `.mir/snippets/<name>/` の両方が存在するか確認する。どちらかが欠けている場合はエラー。

### Step 2: snippet 定義バリデーション

`.mir/snippets/<name>.yaml` を読み取り、スキーマに基づいてバリデーションを行う。

### Step 3: 対象 registry の決定

登録先 registry を決定する:

- `--registry` 指定時: 該当 registry を使用。存在しない場合はエラー
- 未指定時: `registries` の先頭のローカル registry を使用

### Step 4: 確認プロンプト表示

interactive モード（デフォルト）では以下の情報を表示し、確認を求める:

- Snippet 名
- テンプレートディレクトリの場所
- 登録先 registry

`--no-interactive` 指定時はスキップ。

### Step 5: registry へ登録

#### ローカル registry の場合

ソースファイルを registry にコピーする。

- 同名 snippet が存在しない → コピー
- 存在する + `--force` なし → エラー（interactive モードでは上書き確認）
- 存在する + `--force` あり → 既存を削除してコピー

#### リモート registry の場合

`POST <url>/api/snippets` に定義ファイルとテンプレートファイルを送信する。

1. **認証**: `publish_token`（`mir login` で取得）を Bearer トークンとして送信。token がない場合はエラー
2. **所有権チェック**: snippet の所有権は最初に publish したユーザーに帰属。owner 以外が `--force` で上書きしようとするとエラー
3. **重複チェック**: 同名 snippet が存在する場合は `--force` が必要

### Step 6: 完了メッセージ表示

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
| 認証エラー | リモート registry に publish_token がない | `Authentication required. Run "mir login" first` |
| 所有権エラー | owner 以外が --force で上書きしようとした | `You are not the owner of snippet "<name>"` |

## 関連

- [mir publish コマンド](../command/publish.md) - コマンドの使用方法
- [mir login コマンド](../command/login.md) - リモート registry へのログイン
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - 定義ファイルの仕様
- [registry プロトコル](./registry.md) - registry の構造と規則
