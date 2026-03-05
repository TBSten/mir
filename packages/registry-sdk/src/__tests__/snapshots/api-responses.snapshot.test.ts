/**
 * registry-sdk: API レスポンスの snapshot テスト
 */
import { describe, it, expect } from "vitest";
import { createRegistryRoutes } from "../../routes.js";
import type { RegistryProvider } from "../../types.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

const mockProvider: RegistryProvider = {
  async list() {
    return [
      { name: "react-hook", description: "React カスタムフック雛形" },
      { name: "react-component", description: "React コンポーネント" },
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
            name: { description: "フック名", schema: { type: "string" as const } },
            description: { description: "説明", schema: { type: "string" as const, default: "" } },
          },
          hooks: {
            "after-install": [{ echo: "✅ {{ name }} を作成しました" }],
          },
        },
        files: new Map([
          ["{{ name }}.ts", 'export function {{ name }}() { return null; }'],
          ["{{ name }}.test.ts", 'test("{{ name }}", () => {});'],
        ]),
      };
    }
    return null;
  },
};

describe("API レスポンス snapshot", () => {
  it("GET /api/snippets レスポンス", async () => {
    const app = createRegistryRoutes(mockProvider);
    const res = await app.request("/api/snippets");
    const data = await res.json();
    expect(data).toMatchSnapshot();
  });

  it("GET /api/snippets/react-hook レスポンス", async () => {
    const app = createRegistryRoutes(mockProvider);
    const res = await app.request("/api/snippets/react-hook");
    const data = await res.json();
    expect(data).toMatchSnapshot();
  });

  it("GET /api/snippets/nonexistent 404 レスポンス", async () => {
    const app = createRegistryRoutes(mockProvider);
    const res = await app.request("/api/snippets/nonexistent");
    const data = await res.json();
    expect({ status: res.status, body: data }).toMatchSnapshot();
  });

  it("GET /api/search?q=react レスポンス", async () => {
    const app = createRegistryRoutes(mockProvider);
    const res = await app.request("/api/search?q=react");
    const data = await res.json();
    expect(data).toMatchSnapshot();
  });

  it("GET /api/search?q=nonexistent 空結果", async () => {
    const app = createRegistryRoutes(mockProvider);
    const res = await app.request("/api/search?q=nonexistent");
    const data = await res.json();
    expect(data).toMatchSnapshot();
  });
});
