# @mir/official-registry

mir の公式 Registry サーバー。HonoX + Cloudflare Pages で構築されています。

## 機能

- **Web UI**: スニペット検索・情報表示
- **REST API**: JSON による スニペット取得
- **静的ファイル配信**: スニペット定義ファイル

## デプロイ

### 本番環境（Cloudflare Pages）

```bash
npm run build
npm run deploy
```

### ローカル開発

```bash
npm run dev
# http://localhost:5173 で起動
```

## API エンドポイント

```bash
# スニペット一覧
curl https://mir.tbsten.me/api/snippets

# スニペット詳細
curl https://mir.tbsten.me/api/snippets/hello-world

# スニペット定義
curl https://mir.tbsten.me/static/snippets/hello-world.yaml
```

## ビルド

```bash
# CSS ビルド + Vite SSR ビルド
npm run build
```

出力: `dist/` ディレクトリ

## 技術スタック

- **フレームワーク**: HonoX (Hono + Vite)
- **ホスティング**: Cloudflare Pages
- **CSS**: Tailwind CSS v4
- **テストフレームワーク**: Vitest + Playwright

## 環境変数

`.env.local`:

```
VITE_REGISTRY_URL=https://mir.tbsten.me
```

## ライセンス

MIT
