# @tbsten/mir-registry-sdk

Registry サーバー実装用 SDK。Hono フレームワークベースの REST API を提供します。

## インストール

```bash
npm install @tbsten/mir-registry-sdk @tbsten/mir-core
```

## 機能

- **スニペット一覧 API**: 登録されているスニペット一覧の取得
- **スニペット詳細 API**: スニペット情報の取得
- **スニペット検索 API**: キーワード検索
- **静的ファイル配信**: スニペット定義の配信

## 使用例

```typescript
import { Hono } from 'hono';
import { createRegistryRoutes } from '@tbsten/mir-registry-sdk';

const app = new Hono();

// Registry routes を追加
const routes = createRegistryRoutes();
app.route('/api', routes);

export default app;
```

## API エンドポイント

- `GET /api/snippets` - スニペット一覧取得
- `GET /api/snippets/:name` - スニペット詳細取得
- `GET /api/snippets/:name/schema` - スニペット定義スキーマ取得
- `GET /static/snippets/:name.yaml` - スニペット定義ファイル取得

## 実装例

公式 registry: [@mir/official-registry](../official-registry)

## ライセンス

MIT
