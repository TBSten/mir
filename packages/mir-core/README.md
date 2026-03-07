# @tbsten/mir-core

共有コアロジックライブラリ。Handlebars テンプレートエンジン、スキーマ検証、i18n、リモート registry アクセスなどの機能を提供します。

## インストール

```bash
npm install @tbsten/mir-core
```

## 機能

- **テンプレートエンジン**: Handlebars による変数展開
- **スキーマ検証**: Snippet と config の JSON Schema 検証
- **i18n 対応**: 日本語・英語のメッセージ管理
- **リモート Registry**: HTTP ベースの registry からスニペット取得
- **エラー処理**: カスタムエラークラスと詳細メッセージ

## 使用例

```typescript
import { expandTemplate, loadSnippetSchema } from '@tbsten/mir-core';

// テンプレート展開
const result = expandTemplate('Hello {{name}}!', { name: 'World' });
console.log(result); // "Hello World!"

// スキーマ検証
const schema = await loadSnippetSchema();
const isValid = validateSnippetYaml(snippetData, schema);
```

## API

詳細は [src/index.ts](./src/index.ts) を参照してください。

- `expandTemplate(template, variables)` - Handlebars テンプレート展開
- `loadSnippetSchema()` - Snippet スキーマ読み込み
- `loadMirconfigSchema()` - Mirconfig スキーマ読み込み
- `validateSnippetYaml(data, schema)` - YAML バリデーション
- `RemoteRegistry` - リモート registry クライアント

## ライセンス

MIT
