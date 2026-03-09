# 設定ファイル仕様 (config.yaml)

mir の設定ファイルの仕様。全フィールドは省略可能で、デフォルト値で動作する。

## ファイルパス

### グローバル設定

```
~/.mir/config.yaml
```

全プロジェクト共通の設定。

### ローカル設定

```
.mir/config.yaml
```

プロジェクト固有の設定。グローバル設定よりも優先される。

### ローカル個人設定

```
.mir/config.local.yaml
```

個人の秘匿設定（`publish_token` 等）。`mir init` 時に `.gitignore` に自動追加される。ローカル設定よりも優先される。

## マージルール

3つの設定ファイルが以下の優先順位でマージされる（後のものが優先）:

1. **グローバル設定** (`~/.mir/config.yaml`)
2. **ローカル設定** (`.mir/config.yaml`)
3. **ローカル個人設定** (`.mir/config.local.yaml`)

各レイヤーのマージルール:

- **registries**: 優先側の registries が先頭、下位の registries が後方に配置。同名の registry は優先側が勝つ（下位側は除外）
- **defaults**: 優先側の値で下位の値を上書き
- **locale**: 優先側の値を使用（未設定の場合は下位から継承）

## JSON Schema

スキーマファイル: [`../../schema/v1/mirconfig.schema.json`](../../schema/v1/mirconfig.schema.json)

エディタで補完を有効にするには、ファイル先頭に以下を追加する:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/tbsten/mir/main/schema/v1/mirconfig.schema.json
```

## フィールド一覧

| フィールド | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `registries` | `registryEntry[]` | No | `[{ path: "~/.mir/registry" }]` | registry の一覧 |
| `registries[].name` | `string` | No | - | registry の識別名 |
| `registries[].path` | `string` | `url` と排他 | - | ローカル registry のディレクトリパス |
| `registries[].url` | `string` | `path` と排他 | - | リモート registry の URL |
| `registries[].publish_token` | `string` | No | - | リモート registry への publish 用 API トークン |
| `locale` | `"ja" \| "en"` | No | `"ja"` | CLI の表示言語 |
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
    url: string           # URL（path と排他）
    publish_token: string  # publish 用 API トークン（任意）

# CLI の表示言語（任意）
locale: ja | en

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
| リモート | `url` | ✅ | ✅（認証が必要） |

#### 検索・登録ルール

- **`mir install`**: 配列の先頭から順に検索し、最初にマッチした snippet を使用する。`--registry` で特定の registry を指定可能。ローカル・リモートの両方を検索対象にする
- **`mir publish`**: ローカル registry またはリモート registry（認証済み）に登録する。デフォルトで先頭のローカル registry に登録。`--registry` で登録先を指定可能。リモート registry への publish には `publish_token` が必要（`mir login` で取得）

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

リモート registry の URL（`https://` で始まること）。`mir install` と `mir publish`（認証済み）で使用可能。

```yaml
registries:
  - name: community
    url: https://example.com/mir-registry
```

リモート registry は [リモート registry プロトコル](../protocol/registry.md#リモート-registry) に準拠する必要がある。

#### registries[].publish_token

リモート registry への publish 時に使用する API トークン。`mir login` コマンドで自動的に設定される。手動で設定することも可能。

```yaml
registries:
  - name: official
    url: https://mir-registry.example.com
    publish_token: mir_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

トークンは `mir login` で GitHub OAuth 認証後に発行される。詳細は [mir login](../command/login.md) を参照。

### defaults.author

`mir create` で snippet を作成する際のデフォルト author 名。

```yaml
defaults:
  author: tbsten
```

## 完全な例

### グローバル設定 (`~/.mir/config.yaml`)

```yaml
registries:
  - name: default
    path: ~/.mir/registry
  - name: official
    url: https://mir-registry.example.com
    publish_token: mir_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

defaults:
  author: tbsten
```

### ローカル設定 (`.mir/config.yaml`)

```yaml
registries:
  - name: team
    path: ~/shared/team-snippets
```

この場合、マージ結果は:
1. `team` (ローカル)
2. `default` (グローバル)
3. `official` (グローバル)

の順で検索される。

## 設定ファイルが存在しない場合

設定ファイルが存在しない場合、全てデフォルト値で動作する。手動で作成する必要はない。

## 関連

- [JSON Schema](../../schema/v1/mirconfig.schema.json) - バリデーション用スキーマ
- [snippet-yaml 仕様](./snippet-yaml.md) - snippet 定義ファイル
- [registry プロトコル](../protocol/registry.md) - registry の構造と規則
- [mir login](../command/login.md) - リモート registry へのログイン
- [mir logout](../command/logout.md) - ログアウト
