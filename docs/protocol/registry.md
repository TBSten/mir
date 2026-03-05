# Registry プロトコル

snippet の保存先であるローカル registry のディレクトリ構造・命名規則・整合性ルールを定義する。

## ディレクトリ構造

mir は 2 つのディレクトリを使い分ける。

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
  registry/
    <name>.yaml          # snippet 定義ファイル
    <name>/              # テンプレートファイル群
```

`mir publish` で登録された snippet。`mir install` で参照される。

registry パスは `~/.mir/mirconfig.yaml` の `registry.path` で変更可能（デフォルト: `~/.mir/registry`）。

## snippet の状態遷移

```
draft → published
```

| 状態 | 場所 | 作成コマンド |
|---|---|---|
| draft | `.mir/snippets/` | `mir create` |
| published | `~/.mir/registry/` | `mir publish` |

- `mir create` → draft 状態の snippet を作成
- `mir publish` → draft を registry にコピーし published 状態にする
- `mir install` → published 状態の snippet をカレントディレクトリに展開

## ファイル命名規則

### snippet 名

- 英数字・ハイフンのみ使用可能
- パターン: `^[a-zA-Z0-9][a-zA-Z0-9-]*$`
- 先頭は英数字（ハイフン不可）

### ファイル構成

snippet は常に **定義ファイル**（`.yaml`）と**テンプレートディレクトリ**のペアで構成される。

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
3. **一意性ルール**: 同一ディレクトリ内に同名の snippet は存在できない
   - registry 内の上書きは `mir publish --force` でのみ許可

## 関連

- [mirconfig.yaml 仕様](../settings/mirconfig-yaml.md) - registry パスの設定
- [snippet-yaml 仕様](../settings/snippet-yaml.md) - snippet 定義ファイルの詳細
- [create フロー](./create-flow.md) - snippet 作成時のファイルシステム操作
- [publish フロー](./publish-flow.md) - snippet 登録時のファイルシステム操作
- [install フロー](./install-flow.md) - snippet インストール時のファイルシステム操作
