# Registry プロトコル

snippet の保存先である registry のディレクトリ構造・命名規則・整合性ルールを定義する。

## registry の種類

| 種類 | 設定フィールド | install | publish | 説明 |
|---|---|---|---|---|
| ローカル | `path` | ✅ | ✅ | ファイルシステム上のディレクトリ |
| リモート | `url` | ✅ | ✅（認証要） | HTTP(S) で提供される registry（publish には認証が必要） |

## ディレクトリ構造

mir は 2 種類の snippet 保存先を使い分ける。

### プロジェクト snippet（draft）

```
<project-root>/
  .mir/
    snippets/
      <name>.yaml        # snippet 定義ファイル
      <name>/            # テンプレートファイル群
```

プロジェクト内で作成・編集中の snippet。`mir create` で生成される。

### ローカル registry（published）

```
~/.mir/
  mirconfig.yaml         # グローバル設定（省略可）
  registry/              # デフォルト registry
    <name>.yaml          # snippet 定義ファイル
    <name>/              # テンプレートファイル群
```

`mir publish` で登録された snippet。`mir install` で参照される。

registry は `~/.mir/mirconfig.yaml` の `registries` で複数設定可能（デフォルト: `[{ path: "~/.mir/registry" }]`）。

#### 複数 registry の例

```yaml
# ~/.mir/mirconfig.yaml
registries:
  - name: default
    path: ~/.mir/registry
  - name: team
    path: ~/shared/team-snippets
  - name: community
    url: https://example.com/mir-registry
```

- `mir install` は registries を定義順に検索し、最初にマッチした snippet を使用する
- `mir publish` はデフォルトで先頭のローカル registry に登録する。リモート registry への publish は認証（`mir login`）が必要
- `--registry` オプションで操作対象の registry を指定可能

## リモート registry

### URL 構造

リモート registry は以下の URL パターンで snippet を提供する。

```
<url>/
  index.json             # マニフェスト（snippet 一覧とファイルリスト）
  <name>.yaml            # snippet 定義ファイル
  <name>/                # テンプレートファイル群
    <file>
```

### マニフェスト（index.json）

registry のルートに `index.json` を配置する。snippet の一覧と各 snippet のテンプレートファイルリストを含む。

```json
{
  "snippets": {
    "<name>": {
      "files": ["<file1>", "<file2>"]
    }
  }
}
```

#### 例

```json
{
  "snippets": {
    "react-hook": {
      "files": ["{{ name }}.ts", "{{ name }}.test.ts"]
    },
    "express-api": {
      "files": ["index.ts", "routes/{{ name }}.ts"]
    }
  }
}
```

### HTTP エンドポイント

#### 読み取り（認証不要）

| メソッド | パス | 説明 |
|---|---|---|
| GET | `<url>/index.json` | マニフェスト取得 |
| GET | `<url>/<name>.yaml` | snippet 定義ファイル取得 |
| GET | `<url>/<name>/<file>` | テンプレートファイル取得（パスは URL エンコード） |
| GET | `<url>/api/snippets/<name>/dependencies` | 依存関係情報取得 |

#### 書き込み（認証必要）

| メソッド | パス | 説明 |
|---|---|---|
| POST | `<url>/api/snippets` | snippet を publish（Bearer トークン認証） |

#### 認証

| メソッド | パス | 説明 |
|---|---|---|
| GET | `<url>/auth/login` | GitHub OAuth 開始 |
| GET | `<url>/auth/callback` | GitHub OAuth コールバック |
| POST | `<url>/auth/logout` | ログアウト |
| GET | `<url>/api/auth/verify` | Bearer トークン検証 |
| GET/POST | `<url>/api/auth/tokens` | API トークン一覧/発行 |
| DELETE | `<url>/api/auth/tokens/:id` | API トークン削除 |
| GET | `<url>/api/auth/cli-callback` | CLI 用トークン発行コールバック |

全ての読み取りエンドポイントは `200 OK` でレスポンスを返す。snippet が存在しない場合は `404 Not Found` を返す。書き込みエンドポイントは認証が必要で、未認証の場合は `401 Unauthorized` を返す。

### 依存関係エンドポイント

```
GET <url>/api/snippets/<name>/dependencies
```

snippet の依存関係情報を返すエンドポイント。

#### レスポンス

```json
{
  "name": "react-hook",
  "direct": ["react-common", "typescript-utils"],
  "transitive": ["react-common", "typescript-utils", "lodash-helpers"]
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `name` | `string` | snippet 名 |
| `direct` | `string[]` | 直接依存する snippet の名前一覧 |
| `transitive` | `string[]` | 推移的依存（直接・間接両方）する snippet の名前一覧 |

#### 実装例

```json
{
  "react-hook": {
    "direct": ["react-common"],
    "transitive": ["react-common", "lodash-helpers"]
  },
  "express-api": {
    "direct": ["typescript-utils"],
    "transitive": ["typescript-utils", "lodash-helpers"]
  }
}
```

### 認証と所有権

リモート registry への publish には認証が必要。

#### 認証フロー

1. `mir login` で GitHub OAuth 認証を行い、API トークンを取得
2. トークンは `~/.mir/config.yaml` の `publish_token` に保存される
3. `mir publish` 時に `Authorization: Bearer <token>` ヘッダーで認証

#### 所有権モデル

- snippet の所有権は最初に publish したユーザーに帰属
- owner のみが `--force` で上書き可能
- 他ユーザーが同名 snippet を上書きしようとするとエラー

### ホスティング

読み取り専用の registry は静的ファイルサーバー（GitHub Pages, S3, Cloudflare Pages 等）でホスティング可能。publish 機能を提供するには `@tbsten/mir-registry-sdk` を使用してサーバーを実装する。

## snippet の状態遷移

```
draft → published
```

| 状態 | 場所 | 作成コマンド |
|---|---|---|
| draft | `.mir/snippets/` | `mir create` |
| published（ローカル） | `<registry-path>/` | `mir publish` |
| published（リモート） | `<registry-url>/` | `mir publish --registry=<name>` |

- `mir create` → draft 状態の snippet を作成
- `mir publish` → draft をローカルまたはリモート registry に登録し published 状態にする
- `mir install` → published 状態の snippet を展開（ローカル・リモート両方）

## ファイル命名規則

### snippet 名

- 英数字・ハイフンのみ使用可能
- パターン: `^[a-zA-Z0-9][a-zA-Z0-9-]*$`
- 先頭は英数字（ハイフン不可）

### ファイル構成

snippet は常に **定義ファイル**（`.yaml`）と**テンプレートファイル群**のペアで構成される。

| ファイル | 説明 |
|---|---|
| `<name>.yaml` | snippet 定義ファイル |
| `<name>/` | テンプレートファイル群を格納するディレクトリ |

## 整合性ルール

1. **ペアルール**: `<name>.yaml` と `<name>/` は常にペアで存在しなければならない
   - `.yaml` のみでディレクトリがない → 不正
   - ディレクトリのみで `.yaml` がない → 不正
2. **名前一致ルール**: `.yaml` ファイル内の `name` フィールドとファイル名は一致しなければならない
   - `react-hook.yaml` 内の `name` は `react-hook` であること
3. **一意性ルール**: 同一 registry 内に同名の snippet は存在できない
   - ローカル registry 内の上書きは `mir publish --force` でのみ許可
4. **マニフェスト整合性ルール**（リモート registry のみ）: `index.json` の `snippets` に含まれる snippet は、対応する `.yaml` とテンプレートファイルが存在しなければならない

## 関連

- [mirconfig.yaml 仕様](../settings/mirconfig-yaml.md) - registry パスの設定
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細
- [create フロー](./create-flow.md) - snippet 作成時のファイルシステム操作
- [publish フロー](./publish-flow.md) - snippet 登録時のファイルシステム操作
- [install フロー](./install-flow.md) - snippet インストール時のファイルシステム操作
