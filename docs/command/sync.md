# mir sync

テンプレートファイルで使用されている変数を検出し、snippet 定義ファイル (`snippet.yaml`) の `variables` に未定義の変数を自動追加するコマンド。

## Usage

```shell
mir sync [name]
```

## 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `name` | No | 同期する snippet の名前。省略時はローカル snippet 一覧から選択 |

## 動作の詳細

1. `.mir/snippets/<name>/` 内の全ファイルを走査
2. ファイル名・ディレクトリ名・ファイル内容から Handlebars 変数を抽出
3. `snippet.yaml` の `variables` に未定義の変数を `{ schema: { type: "string" } }` で追加
4. 既存の変数定義は変更しない

## 使用例

### 基本的な使い方

```shell
mir sync my-component
```

### snippet 名を省略して選択

```shell
mir sync
```

## 関連

- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細仕様
- [mir create](./create.md) - snippet の雛形を作成
