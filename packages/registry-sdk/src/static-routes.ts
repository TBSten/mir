import { Hono } from "hono";
import { cors } from "hono/cors";
import { serializeSnippetYaml } from "@mir/core";
import type { RegistryProvider } from "./types.js";

/**
 * CLI が期待する静的プロトコルルートを作成する。
 *
 * - GET /index.json     — マニフェスト
 * - GET /:name.yaml     — snippet 定義
 * - GET /:name/:file    — テンプレートファイル
 */
export function createStaticProtocolRoutes(
  provider: RegistryProvider,
): Hono {
  const app = new Hono();

  app.use("*", cors());

  // マニフェスト
  app.get("/index.json", async (c) => {
    const list = await provider.list();
    const snippets: Record<string, { files: string[] }> = {};

    for (const summary of list) {
      const detail = await provider.get(summary.name);
      if (detail) {
        snippets[summary.name] = {
          files: [...detail.files.keys()],
        };
      }
    }

    return c.json({ snippets });
  });

  // snippet 定義 YAML
  app.get("/:file{.+\\.yaml$}", async (c) => {
    const file = c.req.param("file") ?? "";
    const nameParam = file.replace(/\.yaml$/, "");
    const detail = await provider.get(nameParam);
    if (!detail) {
      return c.text("Not Found", 404);
    }
    const yaml = serializeSnippetYaml(detail.definition);
    return c.body(yaml, 200, { "Content-Type": "text/yaml" });
  });

  // テンプレートファイル
  app.get("/:name/*", async (c) => {
    const nameParam = c.req.param("name") ?? "";
    const filePath = decodeURIComponent(
      c.req.path.replace(new RegExp(`^.*?/${nameParam}/`), ""),
    );
    const detail = await provider.get(nameParam);
    if (!detail) {
      return c.text("Not Found", 404);
    }
    const content = detail.files.get(filePath);
    if (content === undefined) {
      return c.text("Not Found", 404);
    }
    return c.text(content);
  });

  return app;
}
