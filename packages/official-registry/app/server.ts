import { createApp } from "honox/server";
import { createRegistryRoutes, createStaticProtocolRoutes } from "@tbsten/mir-registry-sdk";
import { staticProvider } from "./lib/provider.js";
import { getProvider } from "./lib/get-provider.js";
import { buildRobotsTxt, buildSitemap } from "./lib/seo.js";

const app = createApp();

// ヘルスチェック
app.get("/health", (c) => c.json({ status: "ok" }));

// SEO エンドポイント
app.get("/robots.txt", (c) => {
  return c.text(buildRobotsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
});

app.get("/sitemap.xml", async (c) => {
  const sitemap = await buildSitemap(staticProvider);
  return c.text(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
});

// API ルート (provider は D1 or static でフォールバック)
app.all("/api/*", (c) => {
  const provider = getProvider(c);
  const registryApp = createRegistryRoutes(provider);
  return registryApp.fetch(c.req.raw, c.env, c.executionCtx);
});

// 静的プロトコルルート (CLI 用)
app.all("/registry/*", (c) => {
  const provider = getProvider(c);
  const registryApp = createStaticProtocolRoutes(provider);
  return registryApp.fetch(c.req.raw, c.env, c.executionCtx);
});

export default app;
