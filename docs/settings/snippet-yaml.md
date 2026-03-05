# snippet 定義ファイル仕様 (snippet.yaml)

snippet の設定・変数・hooks を定義する YAML ファイルの仕様。

## ファイルパス

```
.mir/snippets/<name>.yaml
```

## JSON Schema

スキーマファイル: [`../../schema/v1/snippet.schema.json`](../../schema/v1/snippet.schema.json)

エディタで補完を有効にするには、ファイル先頭に以下を追加する:

```yaml
# yaml-language-server: $schema=../../schema/v1/snippet.schema.json
```

## フィールド一覧

| フィールド | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `name` | `string` | Yes | - | snippet の識別名 |
| `description` | `string` | No | `""` | snippet の説明文 |
| `variables` | `object` | No | `{}` | 変数定義 |
| `hooks` | `object` | No | `{}` | install 前後のアクション |

## スキーマ概要

```yaml
# snippet 名（必須）
name: string

# snippet の説明（任意）
description: string

# 変数定義（任意）
variables:
  <variable-name>:
    name: string          # 表示名。省略時はキー名を使用
    description: string   # 変数の説明
    schema:               # JSON Schema による型定義
      type: string        # "string" | "number" | "boolean"
      default: any        # デフォルト値
      enum: any[]         # 選択肢

# hooks（任意）
hooks:
  before-install:         # install 前に実行するアクション
    - <action>
  after-install:          # install 後に実行するアクション
    - <action>
```

## フィールド詳細

### name（必須）

snippet の識別名。英数字・ハイフンのみ使用可能（パターン: `^[a-zA-Z0-9][a-zA-Z0-9-]*$`）。

```yaml
name: react-hook
```

### description（任意）

snippet の説明文。

```yaml
description: "React カスタムフック用テンプレート"
```

### variables（任意）

snippet で使用する変数を定義する。各変数は JSON Schema ベースで型を指定できる。

```yaml
variables:
  component-name:
    name: component-name
    description: "コンポーネント名"
    schema:
      type: string
  use-typescript:
    name: use-typescript
    description: "TypeScript を使用するか"
    schema:
      type: boolean
      default: true
```

#### 変数スキーマ（variableSchema）

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"string"` \| `"number"` \| `"boolean"` | 変数の型 |
| `default` | `any` | デフォルト値 |
| `enum` | `any[]` | 選択肢 |

変数は以下の場面で使用される:

- テンプレートファイル内での Handlebars 展開（`{{ component-name }}`）
- ファイル名・ディレクトリ名での Handlebars 展開
- hooks 内でのテンプレート展開

### hooks（任意）

snippet の install 前後に実行するアクションを定義する。

#### 対応アクション

##### input

ユーザに追加の入力を求める。

```yaml
- input:
    <variable-name>:
      name: "表示名"
      description: "説明"
      schema:
        type: boolean
      answer-to: <answer-variable>  # 回答を格納する変数名
```

`answer-to` で指定した変数名に入力値が格納され、後続のアクションやテンプレートで参照可能。

##### echo

メッセージを表示する。Handlebars テンプレートで変数展開が可能。

```yaml
- echo: "{{ name }} を作成しました"
```

##### exit

条件に基づいてインストールを中止する。

```yaml
- exit: true
  if: "{{ agree }}"
```

`if` の評価結果が truthy の場合、インストールを中止する。

#### hooks の実行例

```yaml
hooks:
  before-install:
    - input:
        agree-terms:
          name: "利用規約に同意しますか？"
          description: "この snippet を使用するには利用規約への同意が必要です"
          schema:
            type: boolean
          answer-to: agree
    - exit: true
      if: "{{ agree }}"
    - echo: "セットアップを開始します..."
  after-install:
    - echo: "インストールが完了しました"
    - echo: "次のコマンドを実行してください: npm install"
```

## テンプレートファイル

`.mir/snippets/<name>/` ディレクトリ内のファイルは Handlebars テンプレートとして処理される。

### テンプレート構文

Handlebars の標準構文を使用する。

```
{{ variable }}           # 変数展開
{{#if variable}}...{{/if}}  # 条件分岐
{{#each list}}...{{/each}}  # ループ
```

### ファイル名のテンプレート

ファイル名・ディレクトリ名にも Handlebars テンプレートを使用できる。

```
.mir/snippets/my-snippet/
  {{ name }}.ts
  {{ name }}.test.ts
```

`--name=useAuth` でインストールした場合:

```
useAuth.ts
useAuth.test.ts
```

## 完全な例

### snippet 定義ファイル

```yaml
name: react-hook
description: "React カスタムフック用テンプレート"
variables:
  name:
    description: "フック名（use から始めてください）"
    schema:
      type: string
  with-test:
    description: "テストファイルも生成するか"
    schema:
      type: boolean
      default: true
hooks:
  before-install:
    - echo: "React フック {{ name }} を作成します"
  after-install:
    - echo: "{{ name }} を作成しました"
```

### テンプレートファイル構成

```
.mir/snippets/react-hook/
  {{ name }}.ts
  {{ name }}.test.ts
```

### `{{ name }}.ts` の内容

```typescript
import { useState, useCallback } from "react";

export function {{ name }}() {
  const [state, setState] = useState(null);

  const reset = useCallback(() => {
    setState(null);
  }, []);

  return { state, reset };
}
```

## 関連

- [JSON Schema](../../schema/v1/snippet.schema.json) - バリデーション用スキーマ
- [mirconfig.yaml 仕様](./mirconfig-yaml.md) - グローバル設定ファイル
- [mir create](../command/create.md) - snippet の雛形を作成
- [mir publish](../command/publish.md) - snippet をローカル registry に登録
- [mir install](../command/install.md) - snippet をインストール
