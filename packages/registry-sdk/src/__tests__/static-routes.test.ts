/**
 * registry-sdk: 静的プロトコルルートのテスト
 */
import { describe, it, expect } from "vitest";
import { createStaticProtocolRoutes } from "../static-routes.js";
import type { RegistryProvider } from "../types.js";

const mockProvider: RegistryProvider = {
  async list() {
    return [
      { name: "react-hook", description: "React カスタムフック雛形" },
      { name: "express-api", description: "Express API エンドポイント" },
    ];
  },
  async get(name) {
    if (name === "react-hook") {
      return {
        definition: {
          name: "react-hook",
          description: "React カスタムフック雛形",
          variables: {
            name: {
              description: "フック名",
              schema: { type: "string" as const },
            },
          },
        },
        files: new Map([
          ["{{ name }}.ts", "export function {{ name }}() { return null; }"],
          ["{{ name }}.test.ts", 'test("{{ name }}", () => {});'],
        ]),
      };
    }
    if (name === "express-api") {
      return {
        definition: { name: "express-api" },
        files: new Map([["index.ts", "app.get('/', (req, res) => {})"]]),
      };
    }
    return null;
  },
};

describe("GET /index.json", () => {
  it("マニフェストを返す", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request("/index.json");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.snippets).toHaveProperty("react-hook");
    expect(data.snippets["react-hook"].files).toEqual([
      "{{ name }}.ts",
      "{{ name }}.test.ts",
    ]);
    expect(data.snippets).toHaveProperty("express-api");
    expect(data.snippets["express-api"].files).toEqual(["index.ts"]);
  });

  it("CORS ヘッダーが設定されている", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request("/index.json");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("GET /:name.yaml", () => {
  it("snippet 定義を YAML で返す", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request("/react-hook.yaml");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("name: react-hook");
    expect(text).toContain("variables:");
  });

  it("Content-Type が text/yaml", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request("/react-hook.yaml");
    expect(res.headers.get("content-type")).toContain("text/yaml");
  });

  it("存在しない snippet は 404", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request("/nonexistent.yaml");
    expect(res.status).toBe(404);
  });
});

describe("GET /:name/:file", () => {
  it("テンプレートファイルの内容を返す", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request(
      `/react-hook/${encodeURIComponent("{{ name }}.ts")}`,
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("{{ name }}");
  });

  it("存在しない snippet は 404", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request("/nonexistent/index.ts");
    expect(res.status).toBe(404);
  });

  it("存在しないファイルは 404", async () => {
    const app = createStaticProtocolRoutes(mockProvider);
    const res = await app.request("/react-hook/nonexistent.ts");
    expect(res.status).toBe(404);
  });
});
