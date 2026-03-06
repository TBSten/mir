import { createApp } from "honox/server";
import { createRegistryRoutes, createStaticProtocolRoutes } from "@mir/registry-sdk";
import { staticProvider } from "./lib/provider.js";
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

// API ルート (registry-sdk)
app.route("/", createRegistryRoutes(staticProvider));

// 静的プロトコルルート (CLI 用)
app.route("/registry", createStaticProtocolRoutes(staticProvider));

export default app;
