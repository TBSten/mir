# mir publish

snippet を registry に登録するコマンド。ローカル registry とリモート registry の両方に対応。

## Usage

```shell
mir publish <name> [--registry=<name>] [--force] [--no-interactive]
```

## 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `name` | No (省略時は選択) | 登録する snippet の名前 |

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry`, `-r` | 登録先 registry の名前（`mirconfig.yaml` の `registries[].name`） | 先頭のローカル registry |
| `--force`, `-f` | 既存の snippet を上書きして登録 | `false` |
| `--no-interactive` | 対話的な確認を無効化する | `false` |

## 動作の詳細

1. `.mir/snippets/<name>.yaml` の存在を確認する。存在しない場合はエラー
2. `.mir/snippets/<name>/` ディレクトリの存在を確認する。存在しない場合はエラー
3. snippet 定義ファイル（YAML）のバリデーションを行う
4. 確認プロンプトを表示する（`--no-interactive` でスキップ）
   - Snippet 名、テンプレートディレクトリの場所、登録先 registry を表示
5. 対象 registry に snippet を登録する

### ローカル registry の場合

- `<registry-path>/<name>.yaml` に定義ファイルをコピー
- `<registry-path>/<name>/` にテンプレートファイルをコピー
- 既に同名の snippet が存在する場合:
  - `--force` なし → エラー（interactive モードでは上書き確認）
  - `--force` あり → 上書き登録

### リモート registry の場合

- `POST <url>/api/snippets` に定義ファイルとテンプレートファイルを送信
- 認証が必要（`publish_token` を使用）
- token は `mir login` で取得するか、`mirconfig.yaml` に直接設定
- snippet の所有権は最初に publish したユーザーに帰属
  - owner のみが `--force` で上書き可能
  - 他ユーザーが同名 snippet を上書きしようとするとエラー

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

### リモート registry に公開

```shell
# 事前にログインが必要
mir login

# リモート registry に公開
mir publish my-component --registry=official
```

### CI/CD での利用

```shell
mir publish my-component --no-interactive --force
```

## 関連

- [mir login](./login.md) - リモート registry にログイン
- [mir logout](./logout.md) - ログアウト
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細仕様
- [publish フロー](../protocol/publish-flow.md) - ファイルシステム操作の詳細
- [mir create](./create.md) - snippet の雛形を作成
- [mir install](./install.md) - snippet をインストール
