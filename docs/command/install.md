# mir install

snippet をローカル registry からインストール（指定ディレクトリにコピー）するコマンド。

## Usage

```shell
mir install <name> [--out-dir=<path>] [--<variable>=<value> ...]
```

エイリアス: `mir i`

## 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `name` | Yes | インストールする snippet の名前 |

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--out-dir`, `-o` | ファイルの出力先ディレクトリ | `.`（カレントディレクトリ） |
| `--<variable>=<value>` | snippet で定義された変数の値を指定 | - |
| `--no-interactive` | インタラクティブモードを無効化。未指定の必須変数がある場合エラーにする | `false` |
| `--dry-run` | 実際にファイルを書き込まず、生成されるファイル一覧を表示 | `false` |

## 動作の詳細

### 1. snippet の解決

1. ローカル registry（`~/.mir/registry/`）から `<name>` に一致する snippet を検索
2. 見つからない場合はエラーを返す

### 2. 変数の解決

1. snippet 定義の `variables` を読み取る
2. コマンド引数で指定された変数値を収集する
3. 未指定の変数がある場合:
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

### ドライランで確認

```shell
mir install react-hook --name=useAuth --dry-run
```

### 出力先ディレクトリを指定

```shell
mir install react-hook --name=useAuth --out-dir=src/hooks
```

### 非インタラクティブモード（CI 等）

```shell
mir install react-hook --name=useAuth --no-interactive
```

## 関連

- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細仕様
- [install フロー](../protocol/install-flow.md) - ファイルシステム操作の詳細
- [mir create](./create.md) - snippet の雛形を作成
- [mir publish](./publish.md) - snippet をローカル registry に登録
