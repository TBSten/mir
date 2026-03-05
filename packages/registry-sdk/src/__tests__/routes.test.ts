/**
 * registry-sdk: createRegistryRoutes の HTTP レベル unit テスト
 * Hono の testClient 的なアプローチで app.request() を使う
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createRegistryRoutes } from "../routes.js";
import type { RegistryProvider, RegistrySnippetDetail } from "../types.js";
import type { SnippetDefinition } from "@mir/core";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

function createMockProvider(
  snippets: Array<{
    name: string;
    description?: string;
    definition: SnippetDefinition;
    files: Record<string, string>;
  }>,
): RegistryProvider {
  return {
    async list() {
      return snippets.map((s) => ({
        name: s.name,
        description: s.description,
      }));
    },
    async get(name) {
      const snippet = snippets.find((s) => s.name === name);
      if (!snippet) return null;
      return {
        definition: snippet.definition,
        files: new Map(Object.entries(snippet.files)),
      };
    },
    async search(query) {
      return snippets
        .filter(
          (s) =>
            s.name.includes(query) ||
            (s.description?.includes(query) ?? false),
        )
        .map((s) => ({ name: s.name, description: s.description }));
    },
  };
}

const testSnippets = [
  {
    name: "react-hook",
    description: "React カスタムフック雛形",
    definition: {
      name: "react-hook",
      description: "React カスタムフック雛形",
      variables: {
        name: { description: "フック名", schema: { type: "string" as const } },
      },
    },
    files: {
      "{{ name }}.ts": 'export function {{ name }}() { return null; }',
      "{{ name }}.test.ts": 'import { {{ name }} } from "./{{ name }}";\ntest("works", () => {});',
    },
  },
  {
    name: "react-component",
    description: "React コンポーネント",
    definition: {
      name: "react-component",
      description: "React コンポーネント",
      variables: {
        name: { description: "コンポーネント名", schema: { type: "string" as const } },
      },
    },
    files: {
      "{{ name }}.tsx": "<div>{{ name }}</div>",
    },
  },
  {
    name: "express-api",
    description: "Express API エンドポイント",
    definition: { name: "express-api" },
    files: { "index.ts": "app.get('/', (req, res) => {})" },
  },
];

describe("GET /api/snippets", () => {
  it("全 snippet の一覧を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(3);
    expect(data[0]).toHaveProperty("name");
    expect(data[0]).toHaveProperty("description");
  });

  it("空の registry は空配列を返す", async () => {
    const app = createRegistryRoutes(createMockProvider([]));
    const res = await app.request("/api/snippets");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

describe("GET /api/snippets/:name", () => {
  it("存在する snippet の詳細を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/react-hook");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.definition.name).toBe("react-hook");
    expect(data.files).toHaveProperty("{{ name }}.ts");
    expect(data.files).toHaveProperty("{{ name }}.test.ts");
  });

  it("存在しない snippet は 404 を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/nonexistent");
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("nonexistent");
  });
});

describe("GET /api/snippets/:name/files/*", () => {
  it("テンプレートファイルの内容を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request(
      "/api/snippets/react-hook/files/{{ name }}.ts",
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("{{ name }}");
  });

  it("存在しない snippet は 404", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/nonexistent/files/index.ts");
    expect(res.status).toBe(404);
  });

  it("存在しないファイルは 404", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request(
      "/api/snippets/react-hook/files/nonexistent.ts",
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/search", () => {
  it("クエリに一致する snippet を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/search?q=react");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data.map((s: { name: string }) => s.name)).toContain("react-hook");
    expect(data.map((s: { name: string }) => s.name)).toContain("react-component");
  });

  it("一致しないクエリは空配列", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/search?q=nonexistent");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("空クエリは全 snippet を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/search?q=");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(3);
  });

  it("description でも検索可能", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/search?q=Express");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("express-api");
  });
});

describe("search 未実装の provider", () => {
  it("list からフィルタして返す", async () => {
    const providerWithoutSearch: RegistryProvider = {
      async list() {
        return testSnippets.map((s) => ({
          name: s.name,
          description: s.description,
        }));
      },
      async get() {
        return null;
      },
      // search メソッドなし
    };
    const app = createRegistryRoutes(providerWithoutSearch);
    const res = await app.request("/api/search?q=react");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
  });
});
