import { Hono } from "hono";
import type { RegistryProvider } from "./types.js";

/** Hono 用ルートファクトリ */
export function createRegistryRoutes(provider: RegistryProvider): Hono {
  const app = new Hono();

  // snippet 一覧
  app.get("/api/snippets", async (c) => {
    const snippets = await provider.list();
    return c.json(snippets);
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

  return app;
}
