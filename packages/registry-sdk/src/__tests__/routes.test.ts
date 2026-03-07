/**
 * registry-sdk: createRegistryRoutes の HTTP レベル unit テスト
 * Hono の testClient 的なアプローチで app.request() を使う
 */
import { describe, it, expect } from "vitest";
import { createRegistryRoutes } from "../routes.js";
import type { RegistryProvider, RegistrySnippetDetail } from "../types.js";
import type { SnippetDefinition } from "@tbsten/mir-core";

function createMockProvider(
  snippets: Array<{
    name: string;
    version?: string;
    description?: string;
    definition: SnippetDefinition;
    files: Record<string, string>;
  }>,
): RegistryProvider {
  return {
    async list() {
      return snippets.map((s) => ({
        name: s.name,
        version: s.version,
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
        .map((s) => ({ name: s.name, version: s.version, description: s.description }));
    },
  };
}

const testSnippets = [
  {
    name: "react-hook",
    version: "1.0.0",
    description: "React カスタムフック雛形",
    definition: {
      name: "react-hook",
      version: "1.0.0",
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
    version: "2.0.0",
    description: "React コンポーネント",
    definition: {
      name: "react-component",
      version: "2.0.0",
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
  it("全 snippet の一覧をページネーション形式で返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("offset");
    expect(data).toHaveProperty("limit");
    expect(data.items).toHaveLength(3);
    expect(data.total).toBe(3);
    expect(data.offset).toBe(0);
    expect(data.items[0]).toHaveProperty("name");
    expect(data.items[0]).toHaveProperty("description");
  });

  it("limit パラメータで件数を絞り込める (S038)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets?limit=2");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(2);
    expect(data.total).toBe(3);
    expect(data.limit).toBe(2);
    expect(data.offset).toBe(0);
  });

  it("offset パラメータでスキップできる (S038)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets?offset=1");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(2);
    expect(data.total).toBe(3);
    expect(data.offset).toBe(1);
  });

  it("limit と offset を組み合わせたページネーション (S038)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets?limit=2&offset=2");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].name).toBe("express-api");
    expect(data.total).toBe(3);
    expect(data.limit).toBe(2);
    expect(data.offset).toBe(2);
  });

  it("limit 上限は 100 に制限される (S038)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets?limit=999");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.limit).toBe(100);
  });

  it("空の registry は items が空配列で total が 0 を返す", async () => {
    const app = createRegistryRoutes(createMockProvider([]));
    const res = await app.request("/api/snippets");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("version フィールドが含まれる (S035)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets");
    const data = await res.json();
    const reactHook = data.items.find((s: { name: string }) => s.name === "react-hook");
    expect(reactHook.version).toBe("1.0.0");
  });
});

describe("GET /api/snippets/:name/versions", () => {
  it("getVersionHistory 未実装時は definition.version から返す (S039)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/react-hook/versions");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("react-hook");
    expect(Array.isArray(data.versions)).toBe(true);
    expect(data.versions[0].version).toBe("1.0.0");
  });

  it("version のない snippet は空配列を返す (S039)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/express-api/versions");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.versions).toEqual([]);
  });

  it("存在しない snippet は 404 を返す (S039)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/nonexistent/versions");
    expect(res.status).toBe(404);
  });

  it("getVersionHistory 実装済み provider は履歴を返す (S039)", async () => {
    const providerWithHistory: RegistryProvider = {
      ...createMockProvider(testSnippets),
      async getVersionHistory(name) {
        if (name === "react-hook") {
          return [
            { version: "1.0.0", publishedAt: "2026-01-01", description: "Initial release" },
          ];
        }
        return null;
      },
    };
    const app = createRegistryRoutes(providerWithHistory);
    const res = await app.request("/api/snippets/react-hook/versions");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.versions).toHaveLength(1);
    expect(data.versions[0].version).toBe("1.0.0");
    expect(data.versions[0].publishedAt).toBe("2026-01-01");
  });

  it("getVersionHistory が null を返す場合は 404 (S039)", async () => {
    const providerWithHistory: RegistryProvider = {
      ...createMockProvider(testSnippets),
      async getVersionHistory(_name) {
        return null;
      },
    };
    const app = createRegistryRoutes(providerWithHistory);
    const res = await app.request("/api/snippets/nonexistent/versions");
    expect(res.status).toBe(404);
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

  it("定義に version が含まれる (S035)", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/react-hook");
    const data = await res.json();
    expect(data.definition.version).toBe("1.0.0");
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

describe("GET /api/snippets/:name/dependencies (S052)", () => {
  it("直接依存関係を返す", async () => {
    const snippetsWithDeps = [
      {
        name: "base",
        definition: { name: "base" },
        files: { "index.ts": "export const base = 1;" },
      },
      {
        name: "derived",
        definition: {
          name: "derived",
          dependencies: ["base"],
        },
        files: { "index.ts": "import { base } from 'base';" },
      },
    ];
    const app = createRegistryRoutes(createMockProvider(snippetsWithDeps));
    const res = await app.request("/api/snippets/derived/dependencies");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("derived");
    expect(data.direct).toContain("base");
    expect(Array.isArray(data.transitive)).toBe(true);
  });

  it("依存がない snippet は空配列を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/react-hook/dependencies");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.direct).toEqual([]);
  });

  it("存在しない snippet は 404 を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/nonexistent/dependencies");
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("nonexistent");
  });

  it("getTransitiveDependencies 実装時は推移的依存関係も返す", async () => {
    const providerWithTransitive: RegistryProvider = {
      ...createMockProvider(testSnippets),
      async getTransitiveDependencies(name) {
        if (name === "react-component") {
          return ["react-hook"];
        }
        return [];
      },
    };
    const app = createRegistryRoutes(providerWithTransitive);
    const res = await app.request("/api/snippets/react-component/dependencies");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.transitive).toContain("react-hook");
  });

  it("getTransitiveDependencies 未実装時は空配列を返す", async () => {
    const app = createRegistryRoutes(createMockProvider(testSnippets));
    const res = await app.request("/api/snippets/react-hook/dependencies");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.transitive).toEqual([]);
  });
});
