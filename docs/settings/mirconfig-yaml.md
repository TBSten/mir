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
| `registries` | `registryEntry[]` | No | `[{ path: "~/.mir/registry" }]` | registry の一覧 |
| `registries[].name` | `string` | No | - | registry の識別名 |
| `registries[].path` | `string` | `url` と排他 | - | ローカル registry のディレクトリパス |
| `registries[].url` | `string` | `path` と排他 | - | リモート registry の URL（読み取り専用） |
| `defaults.author` | `string` | No | - | snippet 作成時のデフォルト author |

## スキーマ概要

```yaml
# registry の一覧（任意）
registries:
  # ローカル registry
  - name: string          # registry の識別名（任意）
    path: string          # ディレクトリパス（url と排他）

  # リモート registry
  - name: string          # registry の識別名（任意）
    url: string           # URL（path と排他、読み取り専用）

# snippet 作成時のデフォルト値（任意）
defaults:
  author: string          # デフォルト author
```

## フィールド詳細

### registries

registry の一覧を定義する。配列の定義順が検索順序になる。

各エントリは **`path`（ローカル）** または **`url`（リモート）** のいずれかを指定する。両方を同時に指定するとバリデーションエラーになる。

```yaml
registries:
  - name: default
    path: ~/.mir/registry
  - name: team
    path: ~/team-snippets
  - name: community
    url: https://example.com/mir-registry
```

省略時は `[{ path: "~/.mir/registry" }]` が使用される。

#### registry の種類

| 種類 | フィールド | install | publish |
|---|---|---|---|
| ローカル | `path` | ✅ | ✅ |
| リモート | `url` | ✅ | ❌（読み取り専用） |

#### 検索・登録ルール

- **`mir install`**: 配列の先頭から順に検索し、最初にマッチした snippet を使用する。`--registry` で特定の registry を指定可能。ローカル・リモートの両方を検索対象にする
- **`mir publish`**: ローカル registry のみ対象。デフォルトで先頭のローカル registry に登録する。`--registry` で登録先を指定可能。リモート registry を指定した場合はエラー

#### registries[].name

registry の識別名。`--registry` オプションで registry を指定する際に使用する。省略可能。

#### registries[].path

ローカル registry のディレクトリパス。`~` はユーザのホームディレクトリに展開される。

```yaml
registries:
  - name: default
    path: ~/.mir/registry
```

#### registries[].url

リモート registry の URL（`https://` で始まること）。読み取り専用で `mir install` でのみ使用可能。

```yaml
registries:
  - name: community
    url: https://example.com/mir-registry
```

リモート registry は [リモート registry プロトコル](../protocol/registry.md#リモート-registry) に準拠する必要がある。

### defaults.author

`mir create` で snippet を作成する際のデフォルト author 名。

```yaml
defaults:
  author: tbsten
```

## 完全な例

```yaml
registries:
  - name: default
    path: ~/.mir/registry
  - name: team
    path: ~/shared/team-snippets
  - name: community
    url: https://example.com/mir-registry

defaults:
  author: tbsten
```

## 設定ファイルが存在しない場合

`~/.mir/mirconfig.yaml` が存在しない場合、全てデフォルト値で動作する。手動で作成する必要はない。

## 関連

- [JSON Schema](../../schema/mirconfig.schema.json) - バリデーション用スキーマ
- [snippet-yaml 仕様](./snippet-yaml.md) - snippet 定義ファイル
- [registry プロトコル](../protocol/registry.md) - registry の構造と規則
