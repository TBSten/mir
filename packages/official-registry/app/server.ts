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
// NOTE: HonoX のroutes (app/routes/api/*.ts) がこのハンドラ前に処理されるため、
// フォールバックハンドラとしてのみ使用（読み取り専用 GET エンドポイント）
app.get("/api/*", (c) => {
  const provider = getProvider(c);
  const registryApp = createRegistryRoutes(provider);
  return registryApp.fetch(c.req.raw, c.env, c.executionCtx);
});

// Publish エンドポイント (POST /api/snippets)
app.post("/api/snippets", async (c) => {
  const { saveToInMemoryStore } = await import("./lib/in-memory-store.js");
  const { PublishError, saveSnippetToD1, validateAuthToken } = await import(
    "./lib/publish-handler.js"
  );
  const { validateApiToken } = await import("./lib/auth.js");

  // dev 環境判定
  const isDevMode =
    process.env.DEV_MODE === "true" ||
    process.env.NODE_ENV === "development" ||
    typeof (c.env as any)?.D1 === "undefined";

  let ownerId: number | undefined;

  // 本番環境のみ認証チェック
  if (!isDevMode) {
    const authHeader = c.req.header("Authorization");
    const db = (c.env as any)?.D1;

    // DB ベース認証を優先
    if (db) {
      try {
        const tokenUser = await validateApiToken(db, authHeader);
        if (tokenUser) {
          ownerId = tokenUser.userId;
        } else {
          // フォールバック: PUBLISH_API_TOKEN 環境変数
          const envToken = (c.env as any)?.PUBLISH_API_TOKEN;
          try {
            validateAuthToken(authHeader, envToken);
          } catch (error) {
            if (error instanceof PublishError) {
              return c.json({ error: error.message }, error.statusCode as any);
            }
            return c.json({ error: "Unauthorized" }, 401);
          }
        }
      } catch (error) {
        if (error instanceof PublishError) {
          return c.json({ error: error.message }, error.statusCode as any);
        }
        return c.json({ error: "Unauthorized" }, 401);
      }
    } else {
      // DB がない場合は環境変数のみ
      try {
        const envToken = (c.env as any)?.PUBLISH_API_TOKEN;
        validateAuthToken(authHeader, envToken);
      } catch (error) {
        if (error instanceof PublishError) {
          return c.json({ error: error.message }, error.statusCode as any);
        }
        return c.json({ error: "Unauthorized" }, 401);
      }
    }
  }

  // リクエストボディを解析
  let payload;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // ペイロード検証
  if (!payload.definition || !payload.files || typeof payload.files !== "object") {
    return c.json(
      { error: "Missing or invalid 'definition' or 'files'" },
      400
    );
  }

  if (!payload.definition.name) {
    return c.json({ error: "Missing 'definition.name'" }, 400);
  }

  try {
    if (isDevMode) {
      saveToInMemoryStore(
        {
          definition: payload.definition,
          files: new Map(Object.entries(payload.files)),
        },
        payload.force || false
      );
      return c.json(
        {
          message: "Snippet published successfully (in-memory dev mode)",
          name: payload.definition.name,
        },
        201
      );
    } else {
      await saveSnippetToD1(
        (c.env as any).D1,
        payload,
        payload.force || false,
        ownerId,
      );
      return c.json(
        {
          message: "Snippet published successfully",
          name: payload.definition.name,
        },
        201
      );
    }
  } catch (error) {
    if (error instanceof PublishError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json(
      { error: "Failed to publish snippet" },
      500
    );
  }
});

// 静的プロトコルルート (CLI 用)
app.all("/registry/*", (c) => {
  const provider = getProvider(c);
  const registryApp = createStaticProtocolRoutes(provider);

  // /registry プレフィックスを除去して内部ルートにマップ
  // /registry/index.json → /index.json
  // /registry/snippet.yaml → /snippet.yaml
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/registry/, "") || "/";
  const req = new Request(url.toString(), c.req.raw);

  return registryApp.fetch(req, c.env, c.executionCtx);
});

export default app;
