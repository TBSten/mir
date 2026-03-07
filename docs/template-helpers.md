# テンプレートヘルパー

mir のテンプレートでは Handlebars の標準構文に加えて、以下のカスタムヘルパーを使用できます。
ヘルパーはファイル名・ファイル内容の両方で利用可能です。

## ヘルパー一覧

| ヘルパー | 引数 | 説明 | 例 |
|---------|------|------|------|
| `lowercase` | (value) | 全て小文字 | `{{lowercase name}}` → `hello` |
| `uppercase` | (value) | 全て大文字 | `{{uppercase name}}` → `HELLO` |
| `capitalize` | (value) | 先頭大文字 | `{{capitalize name}}` → `Hello` |
| `uncapitalize` | (value) | 先頭小文字 | `{{uncapitalize name}}` → `hello` |
| `replace` | (value, search, replacement) | リテラル文字列置換 | `{{replace package "/" "."}}` → `com.example.app` |
| `camelCase` | (value) | camelCase 変換 | `{{camelCase name}}` → `myComponent` |
| `pascalCase` | (value) | PascalCase 変換 | `{{pascalCase name}}` → `MyComponent` |
| `snakeCase` | (value) | snake_case 変換 | `{{snakeCase name}}` → `my_component` |
| `kebabCase` | (value) | kebab-case 変換 | `{{kebabCase name}}` → `my-component` |
| `trim` | (value) | 前後空白除去 | `{{trim name}}` → `hello` |

## 使用例

### 基本

```handlebars
{{lowercase name}}
{{uppercase name}}
{{camelCase name}}
```

### replace でパッケージパスを変換

```handlebars
{{replace package "/" "."}}
```

変数 `package` が `com/example/app` の場合 → `com.example.app`

### サブ式（ネスト）

ヘルパーはサブ式 `(...)` で組み合わせ可能です。

```handlebars
{{lowercase (replace name "/" ".")}}
{{pascalCase (replace pkg "/" "-")}}
```

### ファイル名での使用

テンプレートのファイル名にもヘルパーを使用できます。

```
{{pascalCase name}}.tsx
{{snakeCase name}}.py
```

## 注意事項

- `replace` は正規表現を受け付けません（ReDoS 防止）。リテラル文字列のみ置換します。
- 全ヘルパーは内部で `String()` による型変換を行います。
- ケース変換ヘルパー（`camelCase`, `pascalCase`, `snakeCase`, `kebabCase`）は `-`, `_`, `.`, スペース, camelCase 境界で単語を分割します。
- `mir sync` はヘルパー名を変数として検出しません（ヘルパー呼び出しの引数のみ変数として抽出されます）。
