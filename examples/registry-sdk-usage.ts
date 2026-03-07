/**
 * @tbsten/mir-registry-sdk の使用例
 */

import { Hono } from 'hono';
import { createRegistryRoutes } from '@tbsten/mir-registry-sdk';

// 例 1: 基本的な Registry サーバー
async function example1_BasicRegistry() {
  const app = new Hono();

  // Registry routes を追加
  const registryRoutes = createRegistryRoutes();
  app.route('/api', registryRoutes);

  // カスタムエンドポイント
  app.get('/health', (c) => {
    return c.json({ status: 'ok', service: 'mir-registry' });
  });

  return app;
}

// 例 2: カスタム middleware を使用
async function example2_RegistryWithMiddleware() {
  const app = new Hono();

  // ログ middleware
  app.use('*', async (c, next) => {
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path}`);
    await next();
  });

  // CORS middleware
  app.use('*', async (c, next) => {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    await next();
  });

  // Registry routes
  const registryRoutes = createRegistryRoutes();
  app.route('/api', registryRoutes);

  return app;
}

// 例 3: 環境に応じた設定
async function example3_EnvironmentConfig() {
  const isDev = process.env.NODE_ENV === 'development';
  const registryUrl = process.env.REGISTRY_URL || 'https://mir.tbsten.me';

  const app = new Hono();

  // 環境に応じたログレベル設定
  if (isDev) {
    app.use('*', async (c, next) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      console.log(`[${c.req.method}] ${c.req.path} - ${duration}ms`);
    });
  }

  // Registry routes
  const registryRoutes = createRegistryRoutes();
  app.route('/api', registryRoutes);

  // Health check
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      registry: registryUrl,
      env: isDev ? 'development' : 'production',
    });
  });

  return app;
}

// 例 4: Cloudflare Workers での使用
export async function example4_CloudflareWorker() {
  // Cloudflare Workers では以下のようにエクスポート

  const app = new Hono();

  // Registry routes
  const registryRoutes = createRegistryRoutes();
  app.route('/api', registryRoutes);

  // Cloudflare Pages での SSR
  app.get('/', (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>mir Registry</title>
        </head>
        <body>
          <h1>Welcome to mir Registry</h1>
          <p><a href="/api/snippets">View snippets API</a></p>
        </body>
      </html>
    `);
  });

  // 404 handling
  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
  });

  return app;
}

// 例 5: API クライアント側での使用
async function example5_ClientUsage() {
  const registryUrl = 'https://mir.tbsten.me';

  // スニペット一覧取得
  const snippetsRes = await fetch(`${registryUrl}/api/snippets`);
  const snippets = await snippetsRes.json();
  console.log('Snippets:', snippets);

  // スニペット詳細取得
  const snippetRes = await fetch(`${registryUrl}/api/snippets/hello-world`);
  const snippet = await snippetRes.json();
  console.log('Snippet:', snippet);

  // スニペット定義取得
  const yamlRes = await fetch(`${registryUrl}/static/snippets/hello-world.yaml`);
  const yaml = await yamlRes.text();
  console.log('Snippet YAML:', yaml);
}

// Export for Cloudflare Workers
export default example4_CloudflareWorker();
