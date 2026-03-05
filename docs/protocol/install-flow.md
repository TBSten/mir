# install フロー

`mir install <name>` 実行時のファイルシステム操作フローを定義する。

## フロー

```
1. snippet 解決
2. 変数解決
3. before-install hooks 実行
4. テンプレート展開
5. after-install hooks 実行
```

### Step 1: snippet 解決

ローカル registry（`~/.mir/registry/`）から `<name>` に一致する snippet を検索する。見つからない場合はエラー。

### Step 2: 変数解決

1. snippet 定義の `variables` を読み取る
2. コマンド引数（`--<variable>=<value>`）で指定された値を収集する
3. 未指定の変数がある場合:
   - インタラクティブモード（デフォルト）: プロンプトで入力を受け付ける
   - `--no-interactive` 指定時: デフォルト値がなければエラー
4. 変数値を variableSchema に基づいてバリデーションする

### Step 3: before-install hooks 実行

`hooks.before-install` のアクションを順番に実行する。

- `input`: ユーザに入力を求め、`answer-to` で指定した変数に格納
- `echo`: メッセージを表示（Handlebars テンプレート展開あり）
- `exit`: `if` 条件が truthy の場合、インストールを中止

### Step 4: テンプレート展開

1. `~/.mir/registry/<name>/` 内のファイルを走査
2. 各ファイルの内容を Handlebars テンプレートとして変数展開
3. ファイル名・ディレクトリ名も Handlebars テンプレートとして展開
4. 展開結果を `--out-dir`（デフォルト: カレントディレクトリ）に出力
   - 出力先ディレクトリが存在しない場合は自動的に作成する

### Step 5: after-install hooks 実行

`hooks.after-install` のアクションを順番に実行する（Step 3 と同じアクション種別）。

## ファイルシステム操作一覧

| 操作 | パス | 条件 |
|---|---|---|
| 存在確認 | `~/.mir/registry/<name>.yaml` | 常に実行。存在しない場合エラー |
| ファイル読み取り | `~/.mir/registry/<name>.yaml` | 常に実行（定義読み取り） |
| ディレクトリ走査 | `~/.mir/registry/<name>/` | 常に実行（テンプレート列挙） |
| ファイル読み取り | `~/.mir/registry/<name>/<template>` | テンプレートごとに実行 |
| ディレクトリ作成 | `<out-dir>` | 存在しない場合のみ |
| ファイル書き込み | `<out-dir>/<展開後パス>` | `--dry-run` でない場合。テンプレートごとに実行 |
| ディレクトリ作成 | `<out-dir>/<展開後ディレクトリ>` | 必要に応じて作成 |

### dry-run モード

`--dry-run` 指定時は、Step 4 のファイル書き込みを行わず、生成予定のファイル一覧を表示する。hooks は実行されない。

## エラーケース

| エラー | 条件 | メッセージ例 |
|---|---|---|
| snippet 不在 | registry に `<name>` が存在しない | `Snippet "<name>" not found in registry` |
| 変数未指定 | `--no-interactive` で必須変数が未指定 | `Missing required variable: "<variable>"` |
| バリデーション失敗 | 変数値がスキーマに適合しない | `Invalid value for "<variable>": <details>` |
| exit による中止 | `exit` アクションの `if` が truthy | `Installation cancelled` |
| ファイル競合 | 出力先に既存ファイルが存在 | `File already exists: <path>` |
| 出力先不正 | `--out-dir` のパスがファイルを指している | `"<path>" is not a directory` |

## 関連

- [mir install コマンド](../command/install.md) - コマンドの使用方法
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - 定義ファイルの仕様（hooks・variables の詳細）
- [registry プロトコル](./registry.md) - registry の構造と規則
