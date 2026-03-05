# mir publish

snippet をローカル registry に登録するコマンド。リモート registry（`url` 指定）への publish はできない。

## Usage

```shell
mir publish <name> [--registry=<name>]
```

## 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `name` | Yes | 登録する snippet の名前 |

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry`, `-r` | 登録先ローカル registry の名前（`mirconfig.yaml` の `registries[].name`） | 先頭のローカル registry |
| `--force`, `-f` | 既存の snippet を上書きして登録 | `false` |

## 動作の詳細

1. `.mir/snippets/<name>.yaml` の存在を確認する。存在しない場合はエラー
2. `.mir/snippets/<name>/` ディレクトリの存在を確認する。存在しない場合はエラー
3. snippet 定義ファイル（YAML）のバリデーションを行う
4. 対象 registry に snippet を登録する
   - `--registry` 指定時: 該当 registry に登録
   - 未指定時: `registries` の先頭の registry に登録
   - `<registry-path>/<name>.yaml` に定義ファイルをコピー
   - `<registry-path>/<name>/` にテンプレートファイルをコピー
5. 既に同名の snippet が registry に存在する場合:
   - `--force` が指定されていなければエラーを返す
   - `--force` が指定されていれば上書き登録する
6. 登録完了メッセージを表示する

### ローカル registry の構造

```
~/.mir/
  registry/
    <name>.yaml
    <name>/
      ... (テンプレートファイル群)
```

## 使用例

### 基本的な使い方

```shell
mir publish my-component
```

### 特定の registry に登録

```shell
mir publish my-component --registry=team
```

### 既存の snippet を上書き

```shell
mir publish my-component --force
```

## 関連

- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細仕様
- [publish フロー](../protocol/publish-flow.md) - ファイルシステム操作の詳細
- [mir create](./create.md) - snippet の雛形を作成
- [mir install](./install.md) - snippet をインストール
