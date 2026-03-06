# mir install

snippet を registry からインストール（指定ディレクトリにコピー）するコマンド。ローカル・リモート両方の registry に対応。

## Usage

```shell
mir install <name> [--registry=<name>] [--out-dir=<path>] [--<variable>=<value> ...]
```

エイリアス: `mir i`

## 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `name` | Yes | インストールする snippet の名前 |

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry`, `-r` | 検索対象の registry 名（`mirconfig.yaml` の `registries[].name`） | 全 registry を順に検索 |
| `--out-dir`, `-o` | ファイルの出力先ディレクトリ | `.`（カレントディレクトリ） |
| `--<variable>=<value>` | snippet で定義された変数の値を指定 | - |
| `--no-interactive` | インタラクティブモードを無効化。未指定の必須変数がある場合エラーにする | `false` |
| `--dry-run` | 実際にファイルを書き込まず、展開内容をプレビュー表示 | `false` |
| `--timeout` | リモート registry へのアクセスタイムアウト秒数 | `30` |

## 動作の詳細

### 1. snippet の解決

1. `--registry` 指定時: 該当 registry のみを検索
2. 未指定時: `registries` を定義順に検索し、最初にマッチした snippet を使用
3. どの registry にも見つからない場合はエラーを返す

### 2. 変数の解決

1. 標準変数（builtin variables）を解決する
2. snippet 定義の `variables` を読み取る
3. コマンド引数で指定された変数値を収集する
4. 未指定の変数がある場合:
   - インタラクティブモード（デフォルト）: プロンプトで入力を受け付ける
   - `--no-interactive` 指定時: エラーを返す
4. 変数値を JSON Schema に基づいてバリデーションする

### 3. hooks の実行（before-install）

snippet 定義の `hooks.before-install` に定義されたアクションを順番に実行する。

対応アクション:
- `input`: ユーザに追加の入力を求める
- `echo`: メッセージを表示する（Handlebars テンプレートで変数展開可能）
- `exit`: 条件に基づいてインストールを中止する

### 4. テンプレートの展開

1. `.mir/snippets/<name>/`（または registry）内のファイルを走査
2. 各ファイルの内容を Handlebars テンプレートとして変数展開する
3. ファイル名・ディレクトリ名も Handlebars テンプレートとして展開する
4. 展開結果を `--out-dir` で指定されたディレクトリに出力する（デフォルト: カレントディレクトリ）
   - 出力先ディレクトリが存在しない場合は自動的に作成する

### 5. hooks の実行（after-install）

snippet 定義の `hooks.after-install` に定義されたアクションを順番に実行する。

## 使用例

### 基本的な使い方

```shell
mir install react-hook
```

### 変数を指定してインストール

```shell
mir install react-hook --name=useAuth --description="認証用カスタムフック"
```

### ドライランで確認（プレビュー）

```shell
mir install react-hook --name=useAuth --dry-run
```

`--dry-run` を指定すると、実際にはファイルを書き込まず、展開されるファイル一覧と内容をプレビュー表示します。本コマンドは [`mir preview`](./preview.md) と同等の動作です。

### 特定の registry から検索（ローカル）

```shell
mir install react-hook --name=useAuth --registry=team
```

### リモート registry から検索

```shell
mir install react-hook --name=useAuth --registry=community
```

### 出力先ディレクトリを指定

```shell
mir install react-hook --name=useAuth --out-dir=src/hooks
```

### タイムアウト指定（リモート registry）

```shell
mir install react-hook --name=useAuth --timeout=60
```

リモート registry へのアクセス時のタイムアウト秒数を指定します。デフォルトは 30 秒。

### 非インタラクティブモード（CI 等）

```shell
mir install react-hook --name=useAuth --no-interactive
```

## 標準変数 (Builtin Variables)

以下の変数は自動的に解決され、テンプレート内で使用できる。ユーザが CLI 引数で同名の変数を指定した場合、ユーザ指定値が優先される。

| 変数名 | 説明 | 解決ロジック |
|---|---|---|
| `project-name` | プロジェクト名 | `package.json` の `name` フィールド。存在しない場合はカレントディレクトリ名 |

```handlebars
Project: {{ project-name }}
```

## 関連

- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細仕様
- [install フロー](../protocol/install-flow.md) - ファイルシステム操作の詳細
- [mir create](./create.md) - snippet の雛形を作成
- [mir publish](./publish.md) - snippet をローカル registry に登録
