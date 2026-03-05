# グローバル設定ファイル仕様 (mirconfig.yaml)

mir のグローバル設定ファイルの仕様。全フィールドは省略可能で、デフォルト値で動作する。

## ファイルパス

```
~/.mir/mirconfig.yaml
```

## JSON Schema

スキーマファイル: [`../../schema/mirconfig.schema.json`](../../schema/mirconfig.schema.json)

エディタで補完を有効にするには、ファイル先頭に以下を追加する:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/tbsten/mir/main/schema/mirconfig.schema.json
```

## フィールド一覧

| フィールド | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `registry.path` | `string` | No | `~/.mir/registry` | ローカル registry のパス |
| `defaults.author` | `string` | No | - | snippet 作成時のデフォルト author |

## スキーマ概要

```yaml
# registry に関する設定（任意）
registry:
  path: string            # ローカル registry のパス

# snippet 作成時のデフォルト値（任意）
defaults:
  author: string          # デフォルト author
```

## フィールド詳細

### registry.path

ローカル registry のディレクトリパス。`mir publish` で snippet が登録される先、`mir install` で snippet を検索する先を指定する。

```yaml
registry:
  path: ~/my-snippets
```

省略時は `~/.mir/registry` が使用される。

### defaults.author

`mir create` で snippet を作成する際のデフォルト author 名。

```yaml
defaults:
  author: tbsten
```

## 完全な例

```yaml
registry:
  path: ~/.mir/registry

defaults:
  author: tbsten
```

## 設定ファイルが存在しない場合

`~/.mir/mirconfig.yaml` が存在しない場合、全てデフォルト値で動作する。手動で作成する必要はない。

## 関連

- [JSON Schema](../../schema/mirconfig.schema.json) - バリデーション用スキーマ
- [snippet-yaml 仕様](./snippet-yaml.md) - snippet 定義ファイル
- [registry プロトコル](../protocol/registry.md) - registry の構造と規則
