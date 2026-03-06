# mir search

キーワードで registry 内の snippet を検索するコマンド。ローカル・リモート両方の registry に対応。

## 使用例

### 基本的な検索

```shell
mir search react
```

### JSON 形式で出力

```shell
mir search react --json
```

### 特定の registry から検索

```shell
mir search react --registry=official
```

### 結果を静かに表示（メタデータなし）

```shell
mir search react --quiet
```

### YAML 形式で出力

```shell
mir search react --yaml
```

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry`, `-r` | 検索対象の registry 名 | 全 registry を順に検索 |
| `--json` | 結果を JSON 形式で出力 | `false` |
| `--yaml` | 結果を YAML 形式で出力 | `false` |
| `--quiet`, `-q` | 結果のみ出力（ヘッダ・メタデータを非表示） | `false` |
| `--timeout` | リモート registry へのアクセスタイムアウト秒数 | `30` |

## 動作の詳細

### 検索方法

1. 各 snippet の名前・説明に対してキーワードマッチングを実行
2. マッチした snippet を一覧表示

### ローカル registry の検索

```shell
mir search react
```

`~/.mir/registry/` （およびミラーコンフィグで設定された他のローカル registry）から検索。

### リモート registry の検索

```shell
mir search react --registry=official
```

リモート registry の `index.json` からマニフェストを取得し、検索。

### 出力形式

#### デフォルト（テーブル形式）

```
Name            Description
────────────────────────────────────
react-hook      React カスタムフック
react-form      フォーム管理
```

#### JSON 形式

```json
[
  {
    "name": "react-hook",
    "description": "React カスタムフック"
  },
  {
    "name": "react-form",
    "description": "フォーム管理"
  }
]
```

#### YAML 形式

```yaml
- name: react-hook
  description: React カスタムフック
- name: react-form
  description: フォーム管理
```

## 関連

- [mir list](./list.md) - 全 snippet を一覧表示
- [mir info](./info.md) - snippet の詳細情報を表示
- [mir install](./install.md) - snippet をインストール
