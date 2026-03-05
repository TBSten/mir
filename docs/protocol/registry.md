# Registry プロトコル

snippet の保存先である registry のディレクトリ構造・命名規則・整合性ルールを定義する。

## registry の種類

| 種類 | 設定フィールド | install | publish | 説明 |
|---|---|---|---|---|
| ローカル | `path` | ✅ | ✅ | ファイルシステム上のディレクトリ |
| リモート | `url` | ✅ | ❌ | HTTP(S) で提供される読み取り専用 registry |

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
- `mir publish` はデフォルトで先頭のローカル registry に登録する（リモート registry には publish 不可）
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

| メソッド | パス | 説明 |
|---|---|---|
| GET | `<url>/index.json` | マニフェスト取得 |
| GET | `<url>/<name>.yaml` | snippet 定義ファイル取得 |
| GET | `<url>/<name>/<file>` | テンプレートファイル取得（パスは URL エンコード） |

全てのエンドポイントは `200 OK` でレスポンスを返す。snippet が存在しない場合は `404 Not Found` を返す。

### ホスティング

静的ファイルサーバー（GitHub Pages, S3, Cloudflare Pages 等）でホスティング可能。特別なサーバーサイドロジックは不要。

## snippet の状態遷移

```
draft → published
```

| 状態 | 場所 | 作成コマンド |
|---|---|---|
| draft | `.mir/snippets/` | `mir create` |
| published（ローカル） | `<registry-path>/` | `mir publish` |
| published（リモート） | `<registry-url>/` | 手動デプロイ |

- `mir create` → draft 状態の snippet を作成
- `mir publish` → draft をローカル registry にコピーし published 状態にする
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
