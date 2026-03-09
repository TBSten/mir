import { Hono } from "hono";
import type { RegistryProvider, RegistryRoutesOptions } from "./types.js";

/**
 * クエリパラメータから limit/offset を解析する。
 * limit は 1 以上 100 以下、offset は 0 以上。
 */
function parsePagination(
  limitStr: string | undefined,
  offsetStr: string | undefined,
): { limit: number | null; offset: number } {
  const offset = Math.max(0, parseInt(offsetStr ?? "0", 10) || 0);
  if (limitStr === undefined) {
    return { limit: null, offset };
  }
  const parsed = parseInt(limitStr, 10);
  const limit = isNaN(parsed) ? null : Math.min(Math.max(1, parsed), 100);
  return { limit, offset };
}

/** Hono 用ルートファクトリ */
export function createRegistryRoutes(provider: RegistryProvider, options?: RegistryRoutesOptions): Hono {
  const app = new Hono();

  // snippet 一覧 (S038: limit/offset ページネーション対応)
  app.get("/api/snippets", async (c) => {
    const all = await provider.list();
    const { limit, offset } = parsePagination(
      c.req.query("limit"),
      c.req.query("offset"),
    );
    const sliced = limit !== null ? all.slice(offset, offset + limit) : all.slice(offset);
    return c.json({
      items: sliced,
      total: all.length,
      offset,
      limit: limit ?? all.length,
    });
  });

  // snippet バージョン履歴 (S039: /:name/versions を先に定義して /:name より優先)
  app.get("/api/snippets/:name/versions", async (c) => {
    const name = c.req.param("name");
    if (provider.getVersionHistory) {
      const history = await provider.getVersionHistory(name);
      if (history === null) {
        return c.json({ error: `Snippet "${name}" not found` }, 404);
      }
      return c.json({ name, versions: history });
    }
    // getVersionHistory 未実装の場合は現在バージョンのみ返す
    const detail = await provider.get(name);
    if (!detail) {
      return c.json({ error: `Snippet "${name}" not found` }, 404);
    }
    const currentVersion = detail.definition.version;
    const versions = currentVersion
      ? [{ version: currentVersion }]
      : [];
    return c.json({ name, versions });
  });

  // snippet 詳細 (定義 + ファイル一覧)
  app.get("/api/snippets/:name", async (c) => {
    const name = c.req.param("name");
    const detail = await provider.get(name);
    if (!detail) {
      return c.json({ error: `Snippet "${name}" not found` }, 404);
    }
    const filesObj: Record<string, string> = {};
    for (const [path, content] of detail.files) {
      filesObj[path] = content;
    }
    return c.json({
      definition: detail.definition,
      files: filesObj,
      authorizationStatus: detail.authorizationStatus,
    });
  });

  // テンプレートファイル内容
  app.get("/api/snippets/:name/files/*", async (c) => {
    const name = c.req.param("name");
    const filePath = c.req.path.replace(`/api/snippets/${name}/files/`, "");
    const detail = await provider.get(name);
    if (!detail) {
      return c.json({ error: `Snippet "${name}" not found` }, 404);
    }
    const content = detail.files.get(filePath);
    if (content === undefined) {
      return c.json({ error: `File "${filePath}" not found` }, 404);
    }
    return c.text(content);
  });

  // 検索
  app.get("/api/search", async (c) => {
    const query = c.req.query("q") ?? "";
    if (provider.search) {
      const results = await provider.search(query);
      return c.json(results);
    }
    // search 未実装の場合は list から name/description でフィルタ
    const all = await provider.list();
    const filtered = all.filter(
      (s) =>
        s.name.includes(query) ||
        (s.description?.includes(query) ?? false),
    );
    return c.json(filtered);
  });

  // publish (auth + publisher が設定されている場合のみ)
  if (options?.auth && options?.publisher) {
    const { auth, publisher } = options;
    app.post("/api/snippets", async (c) => {
      const authContext = await auth.authenticate(c.req.raw);
      if (!authContext) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let payload;
      try {
        payload = await c.req.json();
      } catch {
        return c.json({ error: "Invalid JSON" }, 400);
      }

      if (!payload.definition || !payload.files || typeof payload.files !== "object") {
        return c.json({ error: "Missing or invalid 'definition' or 'files'" }, 400);
      }
      if (!payload.definition.name) {
        return c.json({ error: "Missing 'definition.name'" }, 400);
      }

      try {
        const detail = {
          definition: payload.definition,
          files: new Map<string, string>(Object.entries(payload.files)),
        };
        await publisher.publish(detail, payload.force || false, authContext.userId);
        return c.json({
          message: "Snippet published successfully",
          name: payload.definition.name,
        }, 201);
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: "Failed to publish snippet" }, 500);
      }
    });
  }

  // dependencies (S052: getDependencies 実装)
  app.get("/api/snippets/:name/dependencies", async (c) => {
    const name = c.req.param("name");
    const detail = await provider.get(name);
    if (!detail) {
      return c.json({ error: `Snippet "${name}" not found` }, 404);
    }
    const direct = detail.definition.dependencies ?? [];
    const transitive = provider.getTransitiveDependencies
      ? await provider.getTransitiveDependencies(name)
      : [];
    return c.json({
      name,
      direct,
      transitive,
    });
  });

  return app;
}
