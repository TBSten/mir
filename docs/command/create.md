# mir create

snippet の雛形を作成するコマンド。

## Usage

```shell
mir create <name>
```

## 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `name` | Yes | 作成する snippet の名前。英数字・ハイフンのみ使用可能 |

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--description`, `-d` | snippet の説明文 | `""` |

## 動作の詳細

1. `name` のバリデーションを行う（英数字・ハイフンのみ許可）
2. `.mir/snippets/<name>.yaml` が既に存在する場合はエラーを返す
3. `.mir/snippets/<name>.yaml` に snippet 定義ファイルを作成する
4. `.mir/snippets/<name>/` ディレクトリを作成する
5. 作成完了メッセージを表示する

### 生成されるファイル

#### `.mir/snippets/<name>.yaml`

```yaml
name: <name>
description: ""
variables: {}
hooks:
  before-install: []
  after-install: []
```

#### `.mir/snippets/<name>/`

空のディレクトリ。ここに snippet のテンプレートファイルを配置する。
テンプレートは Handlebars 形式（`{{ variable }}` 構文）で記述する。

## 使用例

### 基本的な使い方

```shell
mir create my-component
```

以下が生成される:

```
.mir/
  snippets/
    my-component.yaml
    my-component/
```

### 説明付きで作成

```shell
mir create react-hook -d "React カスタムフック用テンプレート"
```

## 関連

- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細仕様
- [create フロー](../protocol/create-flow.md) - ファイルシステム操作の詳細
- [mir publish](./publish.md) - 作成した snippet をローカル registry に登録
- [mir install](./install.md) - snippet をインストール
